package com.fiqh.app;

import android.os.Bundle;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.fiqh.app.library.LibraryDownloadPlugin;
import com.fiqh.app.pdf.PdfReaderPlugin;
import com.getcapacitor.BridgeActivity;

/**
 * Capacitor entry point for the app.
 *
 * The native PDF reader and the book downloader are both launched from
 * JavaScript, so their plugins have to be registered here. Without this
 * registration the web layer's plugin proxies have no native counterpart and
 * every call to them silently fails.
 *
 * The window is also made immersive on entry: the status and navigation bars
 * are hidden so the whole app (web pages included) reads edge to edge, the
 * same way the native PDF reader does. A swipe still brings the bars back
 * briefly, and they stay gone once the app regains focus.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registered before super.onCreate() returns, because the Bridge that
        // owns the plugin registry is created there and drops plugins added
        // afterwards.
        registerPlugin(PdfReaderPlugin.class);
        registerPlugin(LibraryDownloadPlugin.class);
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Returning from the native reader or from a transient bar swipe must
        // not leave the bars visible.
        if (hasFocus) hideSystemBars();
    }

    /**
     * Go edge to edge and hide the system bars.
     *
     * Content first draws underneath the bars ({@code setDecorFitsSystemWindows}
     * false), so hiding them expands the reading area instead of shrinking it.
     * {@link WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE}
     * keeps the bars usable but transparent until the window loses focus.
     */
    private void hideSystemBars() {
        Window window = getWindow();
        if (window == null) return;
        WindowCompat.setDecorFitsSystemWindows(window, false);
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller == null) return;
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}