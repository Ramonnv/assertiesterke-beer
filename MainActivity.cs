using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.OS;
using Android.Views;
using Android.Webkit;

namespace SterkeBeer;

[Activity(
    Label = "Sterke Beer",
    MainLauncher = true,
    Icon = "@mipmap/appicon",
    Theme = "@android:style/Theme.Material.NoActionBar.Fullscreen",
    ScreenOrientation = ScreenOrientation.SensorLandscape,
    HardwareAccelerated = true,
    ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.ScreenSize |
                           ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize |
                           ConfigChanges.KeyboardHidden)]
public class MainActivity : Activity
{
    // Het spel wordt geserveerd vanaf dit (interne) adres, zodat 3D-modellen en
    // JavaScript-modules netjes laden. Het verlaat de tablet nooit.
    public const string Host = "appassets.androidplatform.net";
    // Hier staat altijd de nieuwste APK (wordt door GitHub gebouwd)
    public const string Site = "https://ramonnv.github.io/assertiesterke-beer/";
    const string InstallAction = "nl.sterkebeer.spel.INSTALL_STATUS";
    public static MainActivity? Current;
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromMinutes(15) };
    WebView? web;
    InstallReceiver? receiver;

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);
        Current = this;
        Fullscreen();
        receiver = new InstallReceiver();
        var filter = new IntentFilter(InstallAction);
        if (Build.VERSION.SdkInt >= BuildVersionCodes.Tiramisu) RegisterReceiver(receiver, filter, ReceiverFlags.NotExported);
        else RegisterReceiver(receiver, filter);

        web = new WebView(this);
        var s = web.Settings;
        s.JavaScriptEnabled = true;
        s.DomStorageEnabled = true;          // voortgang bewaren
        s.DatabaseEnabled = true;
        s.MediaPlaybackRequiresUserGesture = false;
        s.TextZoom = 100;
        s.AllowFileAccess = false;
        web.SetWebViewClient(new AssetClient(Assets!));
        web.SetWebChromeClient(new WebChromeClient());
        web.SetBackgroundColor(Android.Graphics.Color.ParseColor("#1F1650"));
        SetContentView(web);
        web.LoadUrl($"https://{Host}/index.html");
    }

    void Fullscreen()
    {
        try
        {
            if (Build.VERSION.SdkInt >= BuildVersionCodes.R)
            {
                Window?.SetDecorFitsSystemWindows(false);
                var c = Window?.InsetsController;
                c?.Hide(WindowInsets.Type.StatusBars() | WindowInsets.Type.NavigationBars());
                if (c != null) c.SystemBarsBehavior = (int)WindowInsetsControllerBehavior.ShowTransientBarsBySwipe;
            }
            else
            {
#pragma warning disable CS0618, CA1422
                Window!.DecorView.SystemUiVisibility = (StatusBarVisibility)(SystemUiFlags.ImmersiveSticky | SystemUiFlags.Fullscreen |
                    SystemUiFlags.HideNavigation | SystemUiFlags.LayoutFullscreen | SystemUiFlags.LayoutHideNavigation);
#pragma warning restore CS0618, CA1422
            }
        }
        catch { }
    }

    public override void OnWindowFocusChanged(bool hasFocus)
    {
        base.OnWindowFocusChanged(hasFocus);
        if (hasFocus) Fullscreen();
    }

    protected override void OnDestroy()
    {
        try { if (receiver != null) UnregisterReceiver(receiver); } catch { }
        if (Current == this) Current = null;
        base.OnDestroy();
    }

    /* ---------------- zelf bijwerken ---------------- */
    static string Js(string? v) => "\"" + (v ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", " ") + "\"";

    public string InfoJson()
    {
        long code = 0; string name = "";
        try
        {
#pragma warning disable CS0618, CA1422
            var pi = PackageManager!.GetPackageInfo(PackageName!, 0)!;
            code = Build.VERSION.SdkInt >= BuildVersionCodes.P ? pi.LongVersionCode : pi.VersionCode;
#pragma warning restore CS0618, CA1422
            name = pi.VersionName ?? "";
        }
        catch { }
        return "{\"code\":" + code + ",\"name\":" + Js(name) + "}";
    }

    // Vraagt op de website welke versie de nieuwste is (versie.json naast de APK)
    public string CheckJson()
    {
        try
        {
            var latest = http.GetStringAsync(Site + "apk/versie.json?t=" + DateTime.UtcNow.Ticks).GetAwaiter().GetResult();
            return "{\"installed\":" + InfoJson() + ",\"latest\":" + latest.Trim() + "}";
        }
        catch (System.Exception e)
        {
            return "{\"installed\":" + InfoJson() + ",\"error\":" + Js(e.Message) + "}";
        }
    }

    public void Notify(string state, int pct = 0, string msg = "")
    {
        var js = "window.onAppUpdate && window.onAppUpdate({s:" + Js(state) + ",p:" + pct + ",m:" + Js(msg) + "})";
        RunOnUiThread(() => web?.EvaluateJavascript(js, null));
    }

    public void StartUpdate()
    {
        RunOnUiThread(() =>
        {
            // Eerst toestemming: "apps installeren uit deze bron"
            if (Build.VERSION.SdkInt >= BuildVersionCodes.O && !PackageManager!.CanRequestPackageInstalls())
            {
                try
                {
                    var i = new Intent(Android.Provider.Settings.ActionManageUnknownAppSources, Android.Net.Uri.Parse("package:" + PackageName));
                    StartActivity(i);
                }
                catch { }
                Notify("toestemming");
                return;
            }
            Task.Run(DownloadAndInstall);
        });
    }

    async Task DownloadAndInstall()
    {
        try
        {
            Notify("downloaden", 0);
            using var resp = await http.GetAsync(Site + "apk/SterkeBeer.apk?t=" + DateTime.UtcNow.Ticks, HttpCompletionOption.ResponseHeadersRead);
            resp.EnsureSuccessStatusCode();
            long total = resp.Content.Headers.ContentLength ?? -1;
            var installer = PackageManager!.PackageInstaller;
            var prm = new PackageInstaller.SessionParams(PackageInstallMode.FullInstall);
            prm.SetAppPackageName(PackageName);
            if (total > 0) prm.SetSize(total);
            int id = installer.CreateSession(prm);
            var session = installer.OpenSession(id);
            using (var outS = session.OpenWrite("SterkeBeer.apk", 0, total))
            using (var inS = await resp.Content.ReadAsStreamAsync())
            {
                var buf = new byte[81920]; long done = 0; int n, lastPct = -1;
                while ((n = await inS.ReadAsync(buf, 0, buf.Length)) > 0)
                {
                    await outS.WriteAsync(buf, 0, n); done += n;
                    int pct = total > 0 ? (int)(done * 100 / total) : 0;
                    if (pct != lastPct && pct % 5 == 0) { lastPct = pct; Notify("downloaden", pct); }
                }
                session.Fsync(outS);
            }
            var intent = new Intent(InstallAction).SetPackage(PackageName);
            var flags = PendingIntentFlags.UpdateCurrent;
            if (Build.VERSION.SdkInt >= BuildVersionCodes.S) flags |= PendingIntentFlags.Mutable;
            var pending = PendingIntent.GetBroadcast(this, id, intent, flags)!;
            Notify("installeren", 100);
            session.Commit(pending.IntentSender);
            session.Close();
        }
        catch (System.Exception e)
        {
            Notify("fout", 0, e.Message);
        }
    }

    // Antwoord van Android op de installatie
    class InstallReceiver : BroadcastReceiver
    {
        public override void OnReceive(Context? context, Intent? intent)
        {
            if (intent == null || context == null) return;
            int status = intent.GetIntExtra(PackageInstaller.ExtraStatus, -999);
            if (status == -1) // wacht op bevestiging van de gebruiker
            {
#pragma warning disable CS0618, CA1422
                var confirm = intent.GetParcelableExtra(Intent.ExtraIntent) as Intent;
#pragma warning restore CS0618, CA1422
                if (confirm != null) { confirm.AddFlags(ActivityFlags.NewTask); context.StartActivity(confirm); }
                Current?.Notify("bevestigen", 100);
            }
            else if (status == 0) Current?.Notify("klaar", 100);
            else Current?.Notify("fout", 0, (intent.GetStringExtra(PackageInstaller.ExtraStatusMessage) ?? "") + " (code " + status + ")");
        }
    }

    protected override void OnPause() { base.OnPause(); web?.OnPause(); }
    protected override void OnResume() { base.OnResume(); web?.OnResume(); }

#pragma warning disable CS0672, CA1422
    public override void OnBackPressed()
    {
        if (web == null) { base.OnBackPressed(); return; }
        web.EvaluateJavascript("(window.onAndroidBack ? window.onAndroidBack() : false)",
            new BackCallback(handled => { if (!handled) Finish(); }));
    }
#pragma warning restore CS0672, CA1422

    class BackCallback : Java.Lang.Object, IValueCallback
    {
        readonly Action<bool> done;
        public BackCallback(Action<bool> done) { this.done = done; }
        public void OnReceiveValue(Java.Lang.Object? value) => done(value?.ToString() == "true");
    }

    // Serveert de bestanden uit de map Assets alsof het een website is.
    class AssetClient : WebViewClient
    {
        readonly Android.Content.Res.AssetManager am;
        public AssetClient(Android.Content.Res.AssetManager am) { this.am = am; }

        static string Do(Action a) { a(); return "{\"ok\":true}"; }

        static string Mime(string path)
        {
            var ext = System.IO.Path.GetExtension(path).ToLowerInvariant();
            return ext switch
            {
                ".html" => "text/html",
                ".js" or ".mjs" => "text/javascript",
                ".css" => "text/css",
                ".json" => "application/json",
                ".webmanifest" => "application/manifest+json",
                ".glb" => "model/gltf-binary",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".svg" => "image/svg+xml",
                ".woff2" => "font/woff2",
                _ => "application/octet-stream"
            };
        }

        public override WebResourceResponse? ShouldInterceptRequest(WebView? view, IWebResourceRequest? request)
        {
            var url = request?.Url;
            if (url == null || url.Host != Host) return base.ShouldInterceptRequest(view, request);
            var path = (url.Path ?? "/").TrimStart('/');
            if (path.Length == 0) path = "index.html";
            var headers = new Dictionary<string, string> { ["Access-Control-Allow-Origin"] = "*", ["Cache-Control"] = "no-cache" };
            if (path.StartsWith("__app/"))
            {
                var act = Current;
                string json = act == null ? "{}" : path switch
                {
                    "__app/info" => act.InfoJson(),
                    "__app/check" => act.CheckJson(),
                    "__app/update" => Do(act.StartUpdate),
                    _ => "{}"
                };
                var bytes = System.Text.Encoding.UTF8.GetBytes(json);
                return new WebResourceResponse("application/json", "utf-8", 200, "OK", headers, new System.IO.MemoryStream(bytes));
            }
            try
            {
                var stream = am.Open(path);
                var mime = Mime(path);
                var enc = mime.StartsWith("text") || mime.Contains("json") ? "utf-8" : null;
                return new WebResourceResponse(mime, enc, 200, "OK", headers, stream);
            }
            catch
            {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", headers, null);
            }
        }

        public override bool ShouldOverrideUrlLoading(WebView? view, IWebResourceRequest? request)
        {
            var url = request?.Url;
            if (url == null || url.Host == Host) return false;
            // mail en externe links (uitleg, printbestanden) openen in de eigen apps van het apparaat
            if (url.Scheme == "mailto" || url.Scheme == "https" || url.Scheme == "http")
            {
                try
                {
                    var intent = new Android.Content.Intent(url.Scheme == "mailto" ? Android.Content.Intent.ActionSendto : Android.Content.Intent.ActionView, url);
                    intent.AddFlags(Android.Content.ActivityFlags.NewTask);
                    view?.Context?.StartActivity(intent);
                }
                catch (System.Exception) { }
            }
            return true;
        }
    }
}
