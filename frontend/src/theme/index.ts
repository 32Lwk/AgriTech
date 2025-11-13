import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: "var(--font-geist-sans)",
    body: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
  colors: {
    // 農業らしい自然なカラーパレット
    agri: {
      50: "#f0f9f4",
      100: "#dcf2e3",
      200: "#bce4cc",
      300: "#8fcfab",
      400: "#5ab384",
      500: "#389968",
      600: "#2a7a52",
      700: "#246244",
      800: "#204e38",
      900: "#1c4130",
      950: "#0d2419",
    },
    earth: {
      50: "#faf7f2",
      100: "#f4ede0",
      200: "#e8d9c0",
      300: "#d9bf9a",
      400: "#c9a074",
      500: "#b8875a",
      600: "#a9734d",
      700: "#8c5d41",
      800: "#724d3a",
      900: "#5e4032",
      950: "#322019",
    },
    harvest: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
      950: "#431407",
    },
  },
  styles: {
    global: {
      body: {
        bg: "linear-gradient(to bottom, #f0f9f4 0%, #faf7f2 100%)",
        bgColor: "agri.50",
        color: "gray.900",
        minH: "100vh",
      },
      "*::placeholder": {
        color: "gray.400",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "agri",
      },
      baseStyle: {
        fontWeight: "600",
        borderRadius: "lg",
        // デフォルトでテキストとアイコンの色を継承
        "& svg": {
          color: "currentColor",
        },
      },
      variants: {
        solid: (props: { colorScheme?: string }) => {
          const { colorScheme } = props;
          // agriカラースキームの場合のみカスタムスタイルを適用
          if (colorScheme === "agri") {
            return {
              // 背景色を確実に適用（グラデーションが使えない場合のフォールバック）
              bg: "agri.500 !important",
              background: "linear-gradient(135deg, #389968 0%, #2a7a52 100%) !important",
              color: "white !important",
              _hover: {
                bg: "agri.600 !important",
                background: "linear-gradient(135deg, #2a7a52 0%, #246244 100%) !important",
                color: "white !important",
                transform: "translateY(-1px)",
                boxShadow: "lg",
              },
              _active: {
                bg: "agri.700 !important",
                background: "agri.700 !important",
                transform: "translateY(0)",
                color: "white !important",
              },
              _focus: {
                bg: "agri.500 !important",
                background: "linear-gradient(135deg, #389968 0%, #2a7a52 100%) !important",
                color: "white !important",
                boxShadow: "0 0 0 3px rgba(56, 153, 104, 0.4)",
              },
              _disabled: {
                bg: "agri.400 !important",
                background: "agri.400 !important",
                color: "white !important",
                opacity: 0.6,
              },
              boxShadow: "md",
              transition: "all 0.2s",
              // すべての子要素（テキスト、アイコン、spanなど）に白い色を適用
              "&, & > *": {
                color: "white !important",
              },
              "& svg": {
                color: "white !important",
                fill: "white !important",
              },
              "& span": {
                color: "white !important",
              },
            };
          }
          // その他のcolorSchemeの場合は、Chakra UIのデフォルトの動作を維持
          // colorSchemeに応じた適切な背景色とテキスト色を設定
          const colorMap: Record<string, { bg: string; color: string; hoverBg: string }> = {
            blue: { bg: "blue.500", color: "white", hoverBg: "blue.600" },
            teal: { bg: "teal.500", color: "white", hoverBg: "teal.600" },
            green: { bg: "green.500", color: "white", hoverBg: "green.600" },
            red: { bg: "red.500", color: "white", hoverBg: "red.600" },
            orange: { bg: "orange.500", color: "white", hoverBg: "orange.600" },
            purple: { bg: "purple.500", color: "white", hoverBg: "purple.600" },
            yellow: { bg: "yellow.500", color: "black", hoverBg: "yellow.600" },
            gray: { bg: "gray.500", color: "white", hoverBg: "gray.600" },
          };
          const colors = (colorScheme && colorMap[colorScheme]) || { bg: "gray.500", color: "white", hoverBg: "gray.600" };
          return {
            bg: colors.bg,
            color: colors.color,
            _hover: {
              bg: colors.hoverBg,
              transform: "translateY(-1px)",
              boxShadow: "lg",
            },
            _active: {
              transform: "translateY(0)",
            },
            boxShadow: "md",
            transition: "all 0.2s",
          };
        },
        outline: (props: { colorScheme?: string }) => {
          const { colorScheme } = props;
          if (colorScheme === "agri") {
            return {
              borderColor: "agri.300",
              color: "agri.700",
              _hover: {
                bg: "agri.50",
                borderColor: "agri.400",
                color: "agri.700",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s",
              // すべての子要素（テキスト、アイコン、spanなど）に色を適用
              "&, & > *": {
                color: "agri.700",
              },
              "& svg": {
                color: "agri.700",
              },
              "& span": {
                color: "agri.700",
              },
            };
          }
          // その他のcolorSchemeの場合は、Chakra UIのデフォルトの動作を維持
          const colorMap: Record<string, { border: string; color: string; hoverBg: string }> = {
            blue: { border: "blue.500", color: "blue.700", hoverBg: "blue.50" },
            teal: { border: "teal.500", color: "teal.700", hoverBg: "teal.50" },
            green: { border: "green.500", color: "green.700", hoverBg: "green.50" },
            red: { border: "red.500", color: "red.700", hoverBg: "red.50" },
            orange: { border: "orange.500", color: "orange.700", hoverBg: "orange.50" },
            purple: { border: "purple.500", color: "purple.700", hoverBg: "purple.50" },
            yellow: { border: "yellow.500", color: "yellow.700", hoverBg: "yellow.50" },
            gray: { border: "gray.500", color: "gray.700", hoverBg: "gray.50" },
          };
          const colors = (colorScheme && colorMap[colorScheme]) || { border: "gray.500", color: "gray.700", hoverBg: "gray.50" };
          return {
            borderColor: colors.border,
            color: colors.color,
            _hover: {
              bg: colors.hoverBg,
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s",
          };
        },
        ghost: (props: { colorScheme?: string }) => {
          const { colorScheme } = props;
          if (colorScheme === "agri") {
            return {
              color: "agri.700",
              _hover: {
                bg: "agri.50",
                color: "agri.700",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s",
              // すべての子要素（テキスト、アイコン、spanなど）に色を適用
              "&, & > *": {
                color: "agri.700",
              },
              "& svg": {
                color: "agri.700",
              },
              "& span": {
                color: "agri.700",
              },
            };
          }
          // その他のcolorSchemeの場合は、Chakra UIのデフォルトの動作を維持
          const colorMap: Record<string, { color: string; hoverBg: string }> = {
            blue: { color: "blue.700", hoverBg: "blue.50" },
            teal: { color: "teal.700", hoverBg: "teal.50" },
            green: { color: "green.700", hoverBg: "green.50" },
            red: { color: "red.700", hoverBg: "red.50" },
            orange: { color: "orange.700", hoverBg: "orange.50" },
            purple: { color: "purple.700", hoverBg: "purple.50" },
            yellow: { color: "yellow.700", hoverBg: "yellow.50" },
            gray: { color: "gray.700", hoverBg: "gray.50" },
          };
          const colors = (colorScheme && colorMap[colorScheme]) || { color: "gray.700", hoverBg: "gray.50" };
          return {
            color: colors.color,
            _hover: {
              bg: colors.hoverBg,
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s",
          };
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "xl",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          borderWidth: "1px",
          borderColor: "white",
          bg: "white",
          transition: "all 0.2s",
          _hover: {
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: "full",
        px: 3,
        py: 1,
        fontWeight: "600",
        fontSize: "xs",
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: "lg",
          borderColor: "gray.200",
          _focus: {
            borderColor: "agri.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-agri-500)",
          },
          _hover: {
            borderColor: "agri.300",
          },
        },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: "lg",
        borderColor: "gray.200",
        _focus: {
          borderColor: "agri.500",
          boxShadow: "0 0 0 1px var(--chakra-colors-agri-500)",
        },
        _hover: {
          borderColor: "agri.300",
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: "lg",
          borderColor: "gray.200",
          _focus: {
            borderColor: "agri.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-agri-500)",
          },
          _hover: {
            borderColor: "agri.300",
          },
        },
      },
    },
    Progress: {
      baseStyle: {
        filledTrack: {
          borderRadius: "full",
        },
        track: {
          borderRadius: "full",
        },
      },
    },
  },
});

export default theme;

