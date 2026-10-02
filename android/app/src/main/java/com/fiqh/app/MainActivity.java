package com.fiqh.app;

import android.os.Bundle;

import com.fiqh.app.pdf.PdfReaderPlugin;
import com.getcapacitor.BridgeActivity;

/**
 * Capacitor entry point for the app.
 *
 * The native PDF reader is launched from JavaScript, so its plugin has to be
 * registered here. Without this registration the web layer's {@code PdfReader}
 * proxy has no native counterpart and every {@code open()} call silently fails.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registered before super.onCreate() returns, because the Bridge that
        // owns the plugin registry is created there and drops plugins added
        // afterwards.
        registerPlugin(PdfReaderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}