import { theme } from "../assets/theme";
import React, { useEffect, useRef } from "react";
import { t } from "../assets/lang";
import { View, Text, Animated, StyleSheet, Dimensions, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { fontSize } from "../dev";
import { normalize } from "../dev";

const { width, height } = Dimensions.get("window");

export default function IntroAnimation({ onFinish }) {
    const s = get_s();

    const [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_700Bold });

    // earth animations
    const earthScale = useRef(new Animated.Value(0)).current;
    const earthRotate = useRef(new Animated.Value(0)).current;
    const earthRotation = earthRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "6deg"],
    });

    // text animations
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(40)).current;

    const startX = width * 0.5;
    const startY = -height * 0.4;


    useEffect(() => {
        if (!fontsLoaded) return;

        Animated.sequence([
            // earth scales up
            Animated.timing(earthScale, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),

            // subtle rotation
            Animated.timing(earthRotate, {
                toValue: 1,
                duration: 1000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
            }),

            // welcome text fades in and slides up
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(textTranslateY, {
                    toValue: 0,
                    duration: 800,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: true,
                }),
            ]),

            // hold for a moment
            Animated.delay(1500),
        ]).start(() => {
            if (onFinish) onFinish();
        });

    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <View style={s.container}>

            <Animated.View style={[
                s.iconWrapper,
                {
                    transform: [
                        { scale: earthScale },
                        { rotate: earthRotation }
                    ],
                }
            ]}>
                <Ionicons name="earth" size={normalize(160)} color={theme().primary} />
                <View style={s.earthGlow} />
            </Animated.View>

            <Animated.View style={[
                s.textContainer,
                {
                    opacity: textOpacity,
                    transform: [{ translateY: textTranslateY }],
                }
            ]}>
                <Text style={s.title}>{t("welcome_to_foodfetch")}</Text>
                <Text style={s.subtitle}>{t("your_smart_kitchen_is_loading")}</Text>
            </Animated.View>
        </View>
    );
}
function get_s() {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme().bg, justifyContent: "center", alignItems: "center" },
        iconWrapper: { position: "absolute", justifyContent: "center", alignItems: "center" },
        earthGlow: { position: "absolute", width: normalize(200), height: normalize(200), borderRadius: normalize(100), backgroundColor: "rgba(16, 245, 162, 0.15)" },
        dash: { position: "absolute", width: normalize(30), height: normalize(3), backgroundColor: theme().primary, borderRadius: normalize(1.5) },
        textContainer: { position: "absolute", bottom: height * 0.15, alignItems: "center", paddingHorizontal: normalize(20) },
        title: { fontFamily: "Poppins_700Bold", fontSize: fontSize(6), color: theme().text, textAlign: "center", marginBottom: normalize(8) },
        subtitle: { fontFamily: "Poppins_600SemiBold", fontSize: fontSize(3.5), color: theme().textMuted, textAlign: "center" }
    });
}