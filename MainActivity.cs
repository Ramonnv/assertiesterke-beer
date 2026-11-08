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
    Theme = "@android:style/Theme.Material.Light.NoActionBar.Fullscreen",
    ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.ScreenSize |
                           ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize |
                           ConfigChanges.KeyboardHidden)]
public class MainActivity : Activity
{
    WebView? web;

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);

        web = new WebView(this);
        var s = web.Settings;
        s.JavaScriptEnabled = true;
        s.DomStorageEnabled = true;          // nodig om sterren en levels te bewaren
        s.MediaPlaybackRequiresUserGesture = false;
        s.AllowFileAccess = true;
        s.TextZoom = 100;                     // tekstgrootte van de tablet niet laten meeschalen
        web.SetWebViewClient(new WebViewClient());
        web.SetWebChromeClient(new WebChromeClient());
        web.SetBackgroundColor(Android.Graphics.Color.ParseColor("#BFE6FF"));

        SetContentView(web);

        if (savedInstanceState != null)
            web.RestoreState(savedInstanceState);
        else
            web.LoadUrl("file:///android_asset/index.html");
    }

    protected override void OnSaveInstanceState(Bundle outState)
    {
        base.OnSaveInstanceState(outState);
        web?.SaveState(outState);
    }

    // Terug-knop van Android: eerst het spel laten beslissen (bv. terug naar de kaart)
#pragma warning disable CS0672, CA1422
    public override void OnBackPressed()
    {
        if (web == null) { base.OnBackPressed(); return; }
        web.EvaluateJavascript("(window.onAndroidBack ? window.onAndroidBack() : false)",
            new BackCallback(handled =>
            {
                if (!handled) Finish();
            }));
    }
#pragma warning restore CS0672, CA1422

    class BackCallback : Java.Lang.Object, IValueCallback
    {
        readonly Action<bool> done;
        public BackCallback(Action<bool> done) { this.done = done; }
        public void OnReceiveValue(Java.Lang.Object? value)
        {
            done(value?.ToString() == "true");
        }
    }
}
