import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'screens/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(375, 812), // iPhone X 尺寸
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MaterialApp(
          title: '小龙虾VPN',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.dark,
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF667eea),
              secondary: Color(0xFF764ba2),
              surface: Color(0xFF1a1a2e),
              background: Color(0xFF0f172a),
            ),
            scaffoldBackgroundColor: const Color(0xFF0f172a),
            appBarTheme: const AppBarTheme(
              backgroundColor: Color(0xFF0f172a),
              elevation: 0,
              centerTitle: true,
            ),
            fontFamily: 'NotoSansSC',
          ),
          home: const SplashScreen(),
        );
      },
    );
  }
}
