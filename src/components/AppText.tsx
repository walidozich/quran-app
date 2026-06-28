import { Text, TextProps, TextStyle } from "react-native";
import { colors, textStyles } from "../theme";

type Variant = keyof typeof textStyles;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  style?: TextStyle | TextStyle[];
};

export function AppText({ variant = "body", color = colors.text, style, ...rest }: Props) {
  return (
    <Text
      // RTL Arabic text aligns right by default
      style={[textStyles[variant], { color, textAlign: "right", writingDirection: "rtl" }, style]}
      {...rest}
    />
  );
}
