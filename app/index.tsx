import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>منصة تعليم القرآن</Text>
      <Text style={styles.subtitle}>مرحبا — المرحلة 0 جاهزة</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBF8F1",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F5132",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
});
