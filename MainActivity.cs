using Android.App;
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
    WebView? web;

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);
        Fullscreen();

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
