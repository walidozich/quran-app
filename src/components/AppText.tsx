import { Text, TextProps, TextStyle } from "react-native";
import { textStyles, useColors } from "../theme";

type Variant = keyof typeof textStyles;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  style?: TextStyle | TextStyle[];
};

export function AppText({ variant = "body", color, style, ...rest }: Props) {
  const colors = useColors();
  return (
    <Text
      // RTL Arabic text aligns right by default
      style={[
        textStyles[variant],
        {
          color: color ?? colors.text,
          textAlign: "right",
          writingDirection: "rtl",
          includeFontPadding: true,
          paddingBottom: 2,
        },
        style,
      ]}
      {...rest}
    />
  );
}
