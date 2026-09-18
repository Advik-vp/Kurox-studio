import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";

const API = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#0B0C0E", card: "#12141A", text: "#F4F1EA", border: "#2A2F3A", primary: "#D4A017" },
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Screen({ title, body }: { title: string; body: string }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <Text style={{ color: "#D4A017", letterSpacing: 6, fontWeight: "700" }}>KUROX</Text>
      <Text style={{ color: "#F4F1EA", fontSize: 28, marginTop: 12 }}>{title}</Text>
      <Text style={{ color: "#9B968A", marginTop: 8, lineHeight: 20 }}>{body}</Text>
    </ScrollView>
  );
}

function HomeScreen() {
  return (
    <Screen
      title="Good morning"
      body={"Today’s schedule, due tasks, and upcoming shoots will load from the same FastAPI as web.\n\nPhase 4: camera upload, push, offline cache."}
    />
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#12141A", borderTopColor: "#2A2F3A" },
        tabBarActiveTintColor: "#D4A017",
        tabBarInactiveTintColor: "#6E6A62",
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Schedule" children={() => <Screen title="Schedule" body="Shoots and call times." />} />
      <Tab.Screen name="Tasks" children={() => <Screen title="Tasks" body="My tasks · swipe complete in Phase 4." />} />
      <Tab.Screen name="CRM" children={() => <Screen title="CRM" body="Contacts and follow-ups on the go." />} />
      <Tab.Screen name="More" children={() => <Screen title="More" body="Projects, assets, notifications, settings." />} />
    </Tab.Navigator>
  );
}

function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("arjun@aperture.kurox.dev");
  const [password, setPassword] = useState("Kurox!studio1");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0C0E", justifyContent: "center", padding: 24 }}>
      <Text style={{ color: "#F4F1EA", fontSize: 32, letterSpacing: 8, textAlign: "center" }}>KUROX</Text>
      <Text style={{ color: "#9B968A", textAlign: "center", marginTop: 8 }}>Studio operations · mobile</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholder="Email"
        placeholderTextColor="#6E6A62"
        style={{ marginTop: 32, borderWidth: 1, borderColor: "#2A2F3A", color: "#F4F1EA", padding: 12, borderRadius: 10 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor="#6E6A62"
        style={{ marginTop: 12, borderWidth: 1, borderColor: "#2A2F3A", color: "#F4F1EA", padding: 12, borderRadius: 10 }}
      />
      {error ? <Text style={{ color: "#E5484D", marginTop: 12 }}>{error}</Text> : null}
      <Pressable
        onPress={async () => {
          setPending(true);
          setError(null);
          try {
            const res = await fetch(`${API}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || "Login failed");
            await SecureStore.setItemAsync("kx_access", json.data.tokens.access_token);
            onAuthed();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Login failed");
          } finally {
            setPending(false);
          }
        }}
        style={{ marginTop: 20, backgroundColor: "#D4A017", padding: 14, borderRadius: 10 }}
      >
        <Text style={{ textAlign: "center", fontWeight: "600" }}>{pending ? "Signing in…" : "Sign in"}</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("kx_access").then((t) => {
      setToken(t);
      setBooting(false);
    });
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0C0E", justifyContent: "center" }}>
        <ActivityIndicator color="#D4A017" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      {token ? (
        <Tabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">{() => <LoginScreen onAuthed={() => setToken("1")} />}</Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
