import 'package:flutter/material.dart';

ThemeData buildAppTheme() {
  const primary = Color(0xFF3B7A57);
  const secondary = Color(0xFFF4A261);
  const tertiary = Color(0xFF2A9D8F);
  const surface = Color(0xFFF8F9F4);

  final baseScheme = ColorScheme.fromSeed(
    seedColor: primary,
    secondary: secondary,
    tertiary: tertiary,
    surface: surface,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: baseScheme,
    scaffoldBackgroundColor: surface,
    visualDensity: VisualDensity.adaptivePlatformDensity,
    appBarTheme: AppBarTheme(
      backgroundColor: surface,
      foregroundColor: baseScheme.onSurface,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: const CardTheme(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
      elevation: 2,
    ),
    chipTheme: ChipThemeData(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      selectedColor: baseScheme.primaryContainer,
      backgroundColor: surface,
      secondarySelectedColor: baseScheme.primaryContainer,
      labelStyle: TextStyle(color: baseScheme.onSurface),
      secondaryLabelStyle: TextStyle(color: baseScheme.onPrimaryContainer),
    ),
    snackBarTheme: const SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: Color(0xFF2A2A2A),
      contentTextStyle: TextStyle(color: Colors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    dialogTheme: DialogTheme(
      backgroundColor: surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
      },
    ),
  );
}

