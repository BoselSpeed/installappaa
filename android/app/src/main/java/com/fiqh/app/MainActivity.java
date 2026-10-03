package com.fiqh.app;

import android.os.Bundle;

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
    }
}