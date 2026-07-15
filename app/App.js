import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Platform } from "react-native";
import { navBarHeight, normalize, loadSettings, setupNotifications, registerExpiryCheck, scheduleDailyNotification } from "./dev/index";
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";

import { setLanguage } from "./assets/lang";
import { setTheme, theme, getThemeId } from "./assets/theme";
import { DeviceEventEmitter } from "react-native";

import HomeScreen from "./screens/Home";
import RecipeScreen from "./screens/Recipes";
import ProductsScreen from "./screens/ProductView";
import InsertionScreen from "./screens/ProductInsertion";
import SettingsScreen from "./screens/AppSettings";
import OnboardingScreen from "./screens/OnBoard";
import IntroAnimation from "./screens/IntroAnimation";
//import LanguageSelect from "./screens/LanguageSelect";

import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

export default function App() {
    // using a single state machine for the entire app flow
    const [appState, setAppState] = useState("loading");
    //const [langKey, setLangKey] = useState(0);
    const [themeKey, setThemeKey] = useState(0);

    useEffect(() => {
        //const subLang = DeviceEventEmitter.addListener("language_changed", () => setLangKey(prev => prev + 1));
        const subTheme = DeviceEventEmitter.addListener("theme_changed", () => setThemeKey(prev => prev + 1));
        const subReset = DeviceEventEmitter.addListener("hard_reset", () => {
            setTheme("dark");
            setAppState("intro");
        });
        return () => {
            //subLang.remove();
            subTheme.remove();
            subReset.remove();
        };
    }, []);

    // isolate background services startup to call when needed
    const bootBackgroundServices = async () => {
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "Default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#10f5a2",
            });
        }

        const granted = await setupNotifications();
        if (!granted) return;

        await registerExpiryCheck();
        await scheduleDailyNotification();
    };

    // safe initialization logic
    useEffect(() => {
        async function initApp() {
            try {
                const settings = await loadSettings();
                setLanguage("en"); // english only for now
                setTheme(settings.appearance || "dark");

                if (settings.isFirstLaunch) {
                    // skip language selection — english only for now
                    setAppState("intro");
                } else {
                    // returning user: boot services and go straight to the main app
                    await bootBackgroundServices();
                    setAppState("main");
                }
            } catch (error) {
                console.error("error loading settings:", error);
                setAppState("main"); // fallback to main app if settings fail to load
            }
        }

        initApp();
    }, []);

    // what happens when the user finishes onboarding
    const handleOnboardingComplete = async () => {
        await bootBackgroundServices(); // start services now that we have permission
        setAppState("main");            // switch to main screen
    };

    // state 1: loading
    if (appState === "loading") {
        return (
            <View style={styles.container}>
                <ExpoStatusBar style={getThemeId() === "light" ? "dark" : "light"} />
                <Text style={{ color: "#eee" }}>Preparing kitchen...</Text>
            </View>
        );
    }

    // language selection (disabled)
    // if (appState === "language") {
    //     return <LanguageSelect onFinish={() => setAppState("intro")} />;
    // }

    // intro animation (earth)
    if (appState === "intro") {
        return <IntroAnimation onFinish={() => setAppState("onboarding")} />;
    }

    // onboarding
    if (appState === "onboarding") {
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    // main app
    const navTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: theme().bg,
            card: theme().cardBg,
        },
    };

    return (
        <NavigationContainer key={`en`} theme={navTheme}>
            <Tab.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false,
                    sceneStyle: {
                        backgroundColor: theme().bg
                    },
                    tabBarStyle: {
                        backgroundColor: theme().cardBg,
                        borderTopWidth: 0,
                        elevation: 0,
                        position: "absolute",
                        bottom: navBarHeight,
                        left: 0,
                        right: 0,
                        height: normalize(60),
                        borderRadius: normalize(20),
                        marginHorizontal: normalize(16),
                        paddingBottom: 0,
                        paddingTop: 0,
                    },
                    tabBarItemStyle: {
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingVertical: 0,
                    },
                    tabBarIconStyle: {
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        margin: 0,
                        padding: 0,
                    },
                    tabBarActiveTintColor: theme().primary,
                    tabBarInactiveTintColor: theme().textMuted,
                    tabBarShowLabel: false,
                }}
            >
                <Tab.Screen name="Products" component={ProductsScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="server-outline" size={normalize(22)} color={color} />
                        ),
                    }}
                />
                <Tab.Screen name="Insert" component={InsertionScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="add-circle-outline" size={normalize(22)} color={color} />
                        ),
                    }}
                />
                <Tab.Screen name="Home" component={HomeScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="home-outline" size={normalize(22)} color={color} />
                        ),
                    }}
                />
                <Tab.Screen name="Recipes" component={RecipeScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="book-outline" size={normalize(22)} color={color} />
                        ),
                    }}
                />
                <Tab.Screen name="Settings" component={SettingsScreen}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="cog-outline" size={normalize(22)} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
});