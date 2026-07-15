import { theme } from "../../assets/theme";
import { t } from "../../assets/lang";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import tosText from "../../assets/tos";
import { normalize } from "../../dev";
import { fontSize } from "../../dev";
import { useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";

// handles inline formatting via custom markers: $bold/$, %italic/%, !underline/!
const parseInlineText = (text, stylec) => {
    const regex = /(\$.*?\/\$|%.*?\/%|!.*?\/!)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (part.startsWith("$") && part.endsWith("/$")) {
            return <Text key={index} style={stylec.bold}>{part.slice(1, -2)}</Text>;
        }
        if (part.startsWith("%") && part.endsWith("/%")) {
            return <Text key={index} style={stylec.italic}>{part.slice(1, -2)}</Text>;
        }
        if (part.startsWith("!") && part.endsWith("/!")) {
            return <Text key={index} style={stylec.underline}>{part.slice(1, -2)}</Text>;
        }
        return part;
    });
};

// simple markdown-ish decoder for the TOS text
function tosDecoder(text, stylec) {
    return text
        .split("\n")
        .filter(line => line.trim())
        .map((line, index) => {
            if (line.startsWith("### ")) {
                return (
                    <Text key={index} style={stylec.microTitle}>
                        {parseInlineText(line.slice(4), stylec)}
                    </Text>
                );
            }

            if (line.startsWith("## ")) {
                return (
                    <Text key={index} style={stylec.subTitle}>
                        {parseInlineText(line.slice(3), stylec)}
                    </Text>
                );
            }

            if (line.startsWith("# ")) {
                return (
                    <Text key={index} style={stylec.title}>
                        {parseInlineText(line.slice(2), stylec)}
                    </Text>
                );
            }

            if (line.startsWith("- ")) {
                return (
                    <Text key={index} style={stylec.list}>
                        • {parseInlineText(line.slice(2), stylec)}
                    </Text>
                );
            }

            if (line.startsWith(". ")) {
                return (
                    <Text key={index} style={stylec.paragraph}>
                        {parseInlineText(line.slice(2), stylec)}
                    </Text>
                );
            }

            return (
                <Text key={index} style={stylec.paragraph}>
                    {parseInlineText(line, stylec)}
                </Text>
            );
        });
}

export default function License({ backProp, titleChange }) {
    const stylec = get_stylec();

    const [fontsLoaded] = useFonts({ Poppins_600SemiBold });

    useEffect(() => {
        titleChange(t("tos_and_license"));

        return () => {
            titleChange(t("settings"));
        };
    }, []);

    if (!fontsLoaded) return null;

    return (
        <View style={stylec.main}>
            <TouchableOpacity onPress={() => backProp()} style={stylec.backBtn}>
                <MaterialIcons name={"arrow-back-ios"} size={normalize(20)} color={theme().text} />
            </TouchableOpacity>
            <ScrollView style={stylec.scroll}>
                {tosDecoder(tosText, stylec)}
            </ScrollView>
        </View>
    );
};
function get_stylec() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: normalize(20), paddingHorizontal: normalize(16) },
        backBtn: { marginBottom: normalize(10) },
        backText: { color: theme().textMuted, fontSize: fontSize(3.5), fontFamily: "Poppins_600SemiBold" },
        scroll: { flex: 1 },
        title: { color: theme().text, fontSize: fontSize(7), fontFamily: "Poppins_600SemiBold", marginBottom: normalize(10) },
        subTitle: { color: theme().text, fontSize: fontSize(5), fontFamily: "Poppins_600SemiBold", marginTop: normalize(10), marginBottom: normalize(5) },
        microTitle: { color: theme().textMuted, fontSize: fontSize(4), fontFamily: "Poppins_600SemiBold", marginTop: normalize(8), marginBottom: normalize(4) },
        paragraph: { color: theme().textMuted, fontSize: fontSize(3), fontFamily: "Poppins_600SemiBold", lineHeight: normalize(22), marginBottom: normalize(5) },
        list: { color: theme().textMuted, fontSize: fontSize(3), fontFamily: "Poppins_600SemiBold", lineHeight: normalize(22), marginLeft: normalize(10), marginBottom: normalize(3) },
        bold: { fontWeight: "bold", color: theme().text },
        italic: { fontStyle: "italic" },
        underline: { textDecorationLine: "underline" }
    });
}