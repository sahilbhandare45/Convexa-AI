@echo off
"C:\\Program Files\\Java\\jdk-17.0.18+8\\bin\\java" ^
  --class-path ^
  "C:\\Users\\Sahil\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  arm64-v8a ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  28 ^
  --output ^
  "C:\\Users\\Sahil\\AppData\\Local\\Temp\\agp-prefab-staging9611864692199833458\\staged-cli-output" ^
  "C:\\Users\\Sahil\\.gemini\\antigravity\\scratch\\convexa_frontend\\cvx-build\\intermediates\\cxx\\refs\\react-native-nitro-modules\\3r4q3d25" ^
  "C:\\Users\\Sahil\\.gradle\\caches\\8.14.3\\transforms\\178f0e82ad25272ca0c04c95ad847250\\transformed\\react-android-0.83.1-release\\prefab" ^
  "C:\\Users\\Sahil\\.gradle\\caches\\8.14.3\\transforms\\a70812e029b9117a99b776b3b3ed0144\\transformed\\hermes-android-0.14.0-release\\prefab" ^
  "C:\\Users\\Sahil\\.gradle\\caches\\8.14.3\\transforms\\6a05fb52cb10a5389af1fdd69ddba6e7\\transformed\\fbjni-0.7.0\\prefab"
