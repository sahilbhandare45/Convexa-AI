package com.facebook.react;

import android.app.Application;
import android.content.Context;
import android.content.res.Resources;

import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainPackageConfig;
import com.facebook.react.shell.MainReactPackage;
import java.util.Arrays;
import java.util.ArrayList;

// react-native-sound
import com.zmxv.RNSound.SoundPackage;
// react-native-screens
import com.swmansion.rnscreens.RNScreensPackage;
// @react-native-community/slider
import com.reactnativecommunity.slider.ReactSliderPackage;
// @runanywhere/core
import com.margelo.nitro.runanywhere.RunAnywhereCorePackage;
// @runanywhere/llamacpp
import com.margelo.nitro.runanywhere.llama.RunAnywhereLlamaPackage;
// @runanywhere/onnx
import com.margelo.nitro.runanywhere.onnx.RunAnywhereONNXPackage;
// react-native-fs
import com.rnfs.RNFSPackage;
// react-native-gesture-handler
import com.swmansion.gesturehandler.RNGestureHandlerPackage;
// react-native-linear-gradient
import com.BV.LinearGradient.LinearGradientPackage;
// react-native-live-audio-stream
import com.imxiqi.rnliveaudiostream.RNLiveAudioStreamPackage;
// react-native-nitro-modules
import com.margelo.nitro.NitroModulesPackage;
// react-native-safe-area-context
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
// react-native-sqlite-storage
import org.pgsqlite.SQLitePluginPackage;
// react-native-svg
import com.horcrux.svg.SvgPackage;
// react-native-vector-icons
import com.oblador.vectoricons.VectorIconsPackage;

@SuppressWarnings("deprecation")
public class PackageList {
  private Application application;
  private ReactNativeHost reactNativeHost;
  private MainPackageConfig mConfig;

  public PackageList(ReactNativeHost reactNativeHost) {
    this(reactNativeHost, null);
  }

  public PackageList(Application application) {
    this(application, null);
  }

  public PackageList(ReactNativeHost reactNativeHost, MainPackageConfig config) {
    this.reactNativeHost = reactNativeHost;
    mConfig = config;
  }

  public PackageList(Application application, MainPackageConfig config) {
    this.reactNativeHost = null;
    this.application = application;
    mConfig = config;
  }

  private ReactNativeHost getReactNativeHost() {
    return this.reactNativeHost;
  }

  private Resources getResources() {
    return this.getApplication().getResources();
  }

  private Application getApplication() {
    if (this.reactNativeHost == null) return this.application;
    return this.reactNativeHost.getApplication();
  }

  private Context getApplicationContext() {
    return this.getApplication().getApplicationContext();
  }

  public ArrayList<ReactPackage> getPackages() {
    return new ArrayList<>(Arrays.<ReactPackage>asList(
      new MainReactPackage(mConfig),
      new SoundPackage(),
      new RNScreensPackage(),
      new ReactSliderPackage(),
      new RunAnywhereCorePackage(),
      new RunAnywhereLlamaPackage(),
      new RunAnywhereONNXPackage(),
      new RNFSPackage(),
      new RNGestureHandlerPackage(),
      new LinearGradientPackage(),
      new RNLiveAudioStreamPackage(),
      new NitroModulesPackage(),
      new SafeAreaContextPackage(),
      new SQLitePluginPackage(),
      new SvgPackage(),
      new VectorIconsPackage()
    ));
  }
}