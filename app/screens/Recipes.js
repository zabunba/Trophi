import { theme, getThemeId } from '../assets/theme';
import { StyleSheet, View, Text, Platform, StatusBar, ScrollView, TouchableOpacity, FlatList, Modal, TextInput, InteractionManager, DeviceEventEmitter } from 'react-native';
import { t } from '../assets/lang';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';

import { navBarHeight } from '../dev';
import { fontSize } from '../dev';
import { normalize } from '../dev';
import { getRecipes } from '../dev';
import ModalFilterRecipes from './extra/ModalFilterRecipes';
import { loadSettings } from '../dev';
import { getProducts } from '../dev';

const SCORE_COLOR = {
    a: '#1a9e3f', b: '#8bc34a', c: '#f5c518', d: '#f5832a', e: '#e53935', f: '#b71c1c'
};

const SCORE_ORDER = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };

const ALLERGY_KEYWORDS = {
    dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey'],
    gluten: ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye', 'oats'],
    nuts: ['peanut', 'almond', 'walnut', 'pecan', 'cashew', 'macadamia'],
    shellfish: ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'prawn'],
    eggs: ['egg', 'eggs', 'mayonnaise'],
    soy: ['soy', 'tofu', 'edamame', 'miso', 'tempeh'],
};

const MEAT_FISH_KEYWORDS = [
    'beef', 'pork', 'chicken', 'lamb', 'turkey', 'duck', 'veal', 'venison',
    'bacon', 'ham', 'sausage', 'pepperoni', 'salami', 'prosciutto',
    'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'clam', 'oyster', 'prawn',
    'anchovy', 'sardine', 'mackerel', 'cod', 'haddock', 'halibut', 'trout', 'snapper',
    'scallop', 'squid', 'octopus', 'mussel', 'gelatin', 'lard', 'tallow', 'suet'
];

const DAIRY_EGG_KEYWORDS = [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'ghee',
    'egg', 'eggs', 'mayonnaise', 'meringue', 'albumin'
];

const DIET_EXCLUSIONS = {
    vegetarian: MEAT_FISH_KEYWORDS,
    vegan: [...MEAT_FISH_KEYWORDS, ...DAIRY_EGG_KEYWORDS, 'honey'],
    keto: [
        'sugar', 'flour', 'wheat', 'rice', 'pasta', 'bread', 'potato', 'potatoes',
        'corn', 'oats', 'barley', 'rye', 'quinoa', 'millet', 'sorghum',
        'fruit', 'fruits', 'apple', 'banana', 'orange', 'grape', 'mango', 'pineapple',
        'watermelon', 'melon', 'peach', 'pear', 'plum', 'berry', 'berries', 'strawberry',
        'blueberry', 'raspberry', 'blackberry', 'cherry', 'kiwi', 'papaya', 'guava', 'fig',
        'raisin', 'cranberry', 'juice', 'syrup', 'honey', 'agave', 'molasses', 'maple'
    ],
    paleo: [
        'wheat', 'flour', 'rice', 'pasta', 'bread', 'oats', 'barley', 'rye', 'corn', 'quinoa', 'millet', 'sorghum', 'couscous', 'bulgur', 'farro', 'spelt',
        'soy', 'tofu', 'edamame', 'miso', 'tempeh', 'bean', 'beans', 'lentil', 'lentils', 'peanut', 'peanuts', 'pea', 'peas', 'chickpea', 'chickpeas', 'hummus',
        ...DAIRY_EGG_KEYWORDS,
        'sugar', 'syrup', 'honey', 'agave', 'molasses', 'maple',
        'canola', 'vegetable oil', 'soybean oil', 'corn oil'
    ]
};

const CATEGORY_BRIDGE = [
    { flag: "Dairy", userRx: /milk|leite|lait|cheese|queijo|fromage|queso|butter|manteiga|beurre|yogurt|iogurte|yaourt|cream|nata|crème/, ingRx: /milk|cheese|butter|yogurt|cream|sour cream|leite|queijo|nata|creme|iogurte|manteiga/ },
    { flag: "Proteins", userRx: /chicken|frango|poulet|pollo|beef|vaca|boeuf|pork|porco|cerdo|fish|peixe|poisson|pescado|egg|ovo|oeuf|huevo|meat|carne|viande|tuna|atum|thon|atún|salmon|salmón|sausage|enchido|bacon/, ingRx: /chicken|beef|pork|fish|egg|shrimp|meat|tuna|salmon|sausage|bacon|frango|vaca|porco|peixe|ovo|carne|atum|salmão|enchido|bacalhau/ },
    { flag: "Vegetables", userRx: /tomato|tomate|onion|cebola|oignon|cebolla|garlic|alho|ail|ajo|carrot|cenoura|carotte|zanahoria|potato|batata|pomme de terre|patata|pepper|pimentón|pimiento|broccoli|brócolis|spinach|espinafres|lettuce|alface|cucumber|pepino/, ingRx: /tomato|onion|garlic|carrot|potato|pepper|broccoli|spinach|lettuce|cucumber|mushroom|celery|cabbage|tomate|cebola|alho|cenoura|batata|pimentão|brócolos|espinafre|alface|pepino|cogumelo/ },
    { flag: "Fruits", userRx: /apple|maçã|pomme|manzana|banana|plátano|lemon|limão|citron|limón|orange|laranja|naranja|berry|baie|fresa|strawberry|pineapple|ananas|piña/, ingRx: /apple|banana|lemon|orange|berry|strawberry|pineapple|peach|cranberry|raisin|maçã|banana|limão|laranja|morango|ananas|pêssego/ },
    { flag: "Carbs", userRx: /flour|farinha|farine|harina|rice|arroz|riz|pasta|massa|pâtes|bread|pão|pain|pan|oat|aveia|cereal|céréales|cereales|noodle|fideos|macaroni|esparguete/, ingRx: /flour|rice|pasta|bread|oat|cereal|noodle|spaghetti|macaroni|farinha|arroz|massa|pão|aveia|cereais|fideos|esparguete/ },
    { flag: "Condiments", userRx: /oil|azeite|huile|aceite|salt|sal|sel|sugar|açucar|sucre|azúcar|vinegar|vinagre|sauce|molho|salsa|mustard|mostarda|moutarde|mostaza|ketchup|mayonnaise|mayonesa|maionese|honey|mel|miel|vanilla|baunilha|vanille|vainilla/, ingRx: /oil|salt|sugar|vinegar|spice|sauce|mustard|ketchup|mayonnaise|syrup|honey|vanilla|azeite|sal|açúcar|vinagre|especiaria|molho|mostarda|maionese|mel|baunilha|miel|aceite|azúcar|salsa|mostaza|mayonesa/ },
];

const RecipeCard = memo(({ item, onPress, s }) => (
    <TouchableOpacity style={s.card} onPress={() => onPress(item)}>
        <View style={s.cardContent}>
            <Text style={s.cardName} numberOfLines={1}>{item._trimName}</Text>
            <Text style={s.cardSub} numberOfLines={1}>{item._ingPreview}{item._ingExtra}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: item._scoreColor + '22', borderColor: item._scoreColor }]}>
            <Text style={[s.badgeText, { color: item._scoreColor }]}>{item._upperScore}</Text>
        </View>
    </TouchableOpacity>
));

const SmartRecipeCard = memo(({ item, onPress, s }) => (
    <TouchableOpacity style={s.smartCard} onPress={() => onPress(item)}>
        <View style={[s.badge, { backgroundColor: item._scoreColor + '22', borderColor: item._scoreColor, alignSelf: 'flex-start', marginBottom: normalize(8) }]}>
            <Text style={[s.badgeText, { color: item._scoreColor }]}>{item._upperScore}</Text>
        </View>
        <Text style={s.smartCardName} numberOfLines={2}>{item._trimName}</Text>
    </TouchableOpacity>
));

export default function Recipes({ navigation }) {
    const s = get_s();

    const [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_700Bold });
    const [localThemeKey, setLocalThemeKey] = useState(0);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('theme_changed', () => setLocalThemeKey(k => k + 1));
        return () => sub.remove();
    }, []);
    const [recipes, setRecipes] = useState([]);
    const [userSettings, setUserSettings] = useState(null);
    const [expiringItems, setExpiringItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selected, setSelected] = useState(null);
    const [step, setStep] = useState(0);
    const [search, setSearch] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState({ nutriScore: [], ingredientTypes: [], sort: null });

    useEffect(() => {
        setLoading(true);
        getRecipes()
            .then(data => setRecipes(data))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const fetchSettingsAndInventory = () => {
            InteractionManager.runAfterInteractions(() => {
                Promise.all([
                    loadSettings(),
                    getProducts(),
                ])
                    .then(([settingsData, allProducts]) => {
                        setUserSettings(settingsData);
                        // Keep full product objects — smartRecipes needs .category/.type/.name
                        setExpiringItems(allProducts);
                    });
            });
        };

        fetchSettingsAndInventory();
        const unsubscribeFocus = navigation.addListener('focus', fetchSettingsAndInventory);
        return () => unsubscribeFocus();
    }, [navigation]);

    const handleSelect = useCallback((item) => {
        setSelected(item);
        setStep(0);
    }, []);

    if (!fontsLoaded) return null;

    const processedRecipes = useMemo(() => {
        return recipes.map((r, index) => ({
            ...r,
            _uid: r.id ? String(r.id) : `recipe_${index}_${r.name}`,
            _trimName: (r.name || '').trim(),
            _lowerName: (r.name || '').toLowerCase(),
            _lowerIngs: (r.ingredients || []).join(' ').toLowerCase(),
            _scoreOrder: SCORE_ORDER[r.enutriscore?.toLowerCase()] ?? 9,
            _upperScore: r.enutriscore?.toUpperCase() ?? '?',
            _scoreColor: SCORE_COLOR[r.enutriscore?.toLowerCase()] ?? theme().border,
            _ingPreview: (r.ingredients || []).slice(0, 3).join(', '),
            _ingExtra: (r.ingredients || []).length > 3 ? `  +${r.ingredients.length - 3}` : '',
        }));
    }, [recipes]);

    const filtered = useMemo(() => {
        const lowerSearch = search.toLowerCase();

        return processedRecipes
            .filter(r => {
                if (lowerSearch && !r._lowerName.includes(lowerSearch)) return false;
                if (activeFilters.nutriScore.length > 0 && !activeFilters.nutriScore.includes(r._upperScore)) return false;

                if (activeFilters.ingredientTypes.length > 0) {
                    const has = activeFilters.ingredientTypes.some(t => r.ingredient_types?.includes(t));
                    if (!has) return false;
                }

                if (userSettings?.diet && userSettings.diet !== 'none') {
                    const exclusions = DIET_EXCLUSIONS[userSettings.diet];
                    if (exclusions) {
                        const hasExclusion = exclusions.some(kw => {
                            if (kw === 'egg' && r._lowerIngs.includes('eggplant')) return false;
                            if (kw === 'pea' && (r._lowerIngs.includes('pear') || r._lowerIngs.includes('peach'))) return false;
                            if (kw === 'ham' && r._lowerIngs.includes('shanghai')) return false;
                            return r._lowerIngs.includes(kw);
                        });
                        if (hasExclusion) return false;
                    }
                }

                if (userSettings?.allergies) {
                    for (const [allergy, isEnabled] of Object.entries(userSettings.allergies)) {
                        if (isEnabled) {
                            const keywords = ALLERGY_KEYWORDS[allergy] || [];
                            if (keywords.some(kw => r._lowerIngs.includes(kw))) return false;
                        }
                    }
                }
                return true;
            })
            .sort((a, b) => {
                switch (activeFilters.sort) {
                    case "sort1": return a._lowerName.localeCompare(b._lowerName);
                    case "sort2": return b._lowerName.localeCompare(a._lowerName);
                    case "sort3": return a._scoreOrder - b._scoreOrder;
                    case "sort4": return b._scoreOrder - a._scoreOrder;
                    default: return 0;
                }
            });
    }, [processedRecipes, search, activeFilters, userSettings]);


    const SMART_MATCH_CAP = 30; 

    const smartMatchedUids = useMemo(() => {
        if (!expiringItems || expiringItems.length === 0) return null;

        const userCategories = new Set(expiringItems.map(p => p.category).filter(Boolean));
        const userNames = expiringItems.map(p => (p.type || p.name || '').toLowerCase()).filter(Boolean);

        const activeBridges = CATEGORY_BRIDGE.filter(b =>
            userCategories.has(b.flag) || userNames.some(n => b.userRx.test(n))
        );

        const uids = new Set();
        for (const r of processedRecipes) {
            if (uids.size >= SMART_MATCH_CAP) break;
            const recipeIngs = r.ingredients || [];
            const matched = recipeIngs.some(ing => {
                const ingLower = ing.toLowerCase();
                if (userNames.some(name => ingLower.includes(name) || name.includes(ingLower))) return true;
                return activeBridges.some(b => b.ingRx.test(ingLower));
            });
            if (matched) uids.add(r._uid);
        }
        return uids;
    }, [processedRecipes, expiringItems]);

   
    const smartRecipes = useMemo(() => {
        if (!smartMatchedUids) return [];
        return filtered.filter(r => smartMatchedUids.has(r._uid));
    }, [filtered, smartMatchedUids]);

    const score = selected?.enutriscore?.toLowerCase();
    const scoreColor = SCORE_COLOR[score] ?? theme().border;

    const renderSmartRecipesHeader = useMemo(() => {
        if (search.length > 0) return null;

        if (expiringItems.length === 0) {
            return (
                <View style={s.smartContainer}>
                    <View style={s.smartHeader}>
                        <Ionicons name="warning" size={normalize(18)} color="#f5c518" />
                        <Text style={s.smartTitle}>{t('use_it_before_you_lose_it')}</Text>
                    </View>
                    <Text style={s.smartSub}>{t('recipes_utilizing_your_expiring_ingredie')}</Text>

                    <View style={s.emptySmartContainer}>
                        <Ionicons name="cart-outline" size={normalize(40)} color={theme().border} />
                        <Text style={s.emptySmartText}>{t('your_inventory_is_empty_add_products_to_')}</Text>
                        <TouchableOpacity style={s.emptySmartBtn} onPress={() => navigation.navigate('Insert')}>
                            <Text style={s.emptySmartBtnText}>{t('add_products')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={s.dividerContainer}><View style={s.divider} /></View>
                </View>
            );
        }

        if (smartRecipes.length === 0) {
            return (
                <View style={s.smartContainer}>
                    <View style={s.smartHeader}>
                        <Ionicons name="warning" size={normalize(18)} color="#f5c518" />
                        <Text style={s.smartTitle}>{t('use_it_before_you_lose_it')}</Text>
                    </View>
                    <Text style={s.smartSub}>{t('recipes_utilizing_your_expiring_ingredie')}</Text>

                    <View style={s.emptySmartContainer}>
                        <Ionicons name="restaurant-outline" size={normalize(40)} color={theme().border} />
                        <Text style={s.emptySmartText}>{t('no_recipes_match_your_expiring_ingredien')}</Text>
                    </View>
                    <View style={s.dividerContainer}><View style={s.divider} /></View>
                </View>
            );
        }

        return (
            <View style={s.smartContainer}>
                <View style={s.smartHeader}>
                    <Ionicons name="warning" size={normalize(18)} color="#f5c518" />
                    <Text style={s.smartTitle}>{t('use_it_before_you_lose_it')}</Text>
                </View>
                <Text style={s.smartSub}>{t('recipes_utilizing_your_expiring_ingredie')}</Text>

                <FlatList
                    horizontal
                    data={smartRecipes}
                    keyExtractor={(item) => item._uid}
                    renderItem={({ item }) => <SmartRecipeCard item={item} onPress={handleSelect} s={s} />}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.smartScroll}
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                />
                <View style={s.dividerContainer}><View style={s.divider} /></View>
            </View>
        );
    }, [smartRecipes, search, handleSelect, expiringItems, navigation, localThemeKey]);

    const renderItem = useCallback(({ item }) => (
        <RecipeCard item={item} onPress={handleSelect} s={s} />
    ), [handleSelect, s]);

    return (
        <View style={s.main}>
            <ExpoStatusBar style={getThemeId() === "light" ? "dark" : "light"} />

            <View style={s.header}>
                <Text style={s.title}>{t('recipes')}</Text>
                <Text style={s.sub}>{loading ? 'Loading...' : `${filtered.length} available`}</Text>
            </View>

            <View style={s.headerBody}>
                <View style={s.bodyBar}>
                    <View style={s.bbBar}>
                        <Ionicons name="search-outline" size={normalize(20)} color={theme().textMuted} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search recipes..."
                            placeholderTextColor={theme().textMuted}
                            style={s.bbInputBar}
                            autoCapitalize="none"
                        />
                        {search.length > 0 && (
                            <Ionicons name="close-outline" size={normalize(20)} color={theme().textMuted} onPress={() => setSearch('')} />
                        )}
                        <TouchableOpacity onPress={() => setFilterVisible(true)}>
                            <Ionicons name="options-outline" size={normalize(20)} color={theme().text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={s.body2}>
                <FlatList
                    data={filtered}
                    ListHeaderComponent={renderSmartRecipesHeader}
                    keyExtractor={(item) => item._uid}
                    renderItem={renderItem}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={15}
                    maxToRenderPerBatch={15}
                    windowSize={11}
                    updateCellsBatchingPeriod={50}
                    removeClippedSubviews={Platform.OS === 'android'}
                />
            </View>

            <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
                <View style={s.overlay}>
                    <View style={s.sheet}>
                        <View style={s.sheetHeader}>
                            <View style={s.sheetIcon}>
                                <Text style={s.sheetIconText}>{selected?.name?.[0]}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.sheetTitle} numberOfLines={2}>{selected?._trimName}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginTop: normalize(4) }}>
                                    <View style={[s.badge, { backgroundColor: scoreColor + '22', borderColor: scoreColor }]}>
                                        <Text style={[s.badgeText, { color: scoreColor }]}>{(score ?? '?').toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setSelected(null)}>
                                <Ionicons name="close" size={normalize(22)} color={theme().textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.divider} />

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={s.divider} />

                            <Text style={s.sectionLabel}>{t('ingredient_amounts')}</Text>
                            {selected?.ingredientsValues?.map((ing, i) => (
                                <View key={i} style={s.ingredientRow}>
                                    <View style={s.dot} />
                                    <Text style={s.ingredientText}>{ing}</Text>
                                </View>
                            ))}

                            <View style={s.divider} />

                            <Text style={s.sectionLabel}>{t('how_to_make_it')}</Text>
                            {selected?.tutorial?.map((stepText, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[s.stepCard, step > i && s.stepDone]}
                                    onPress={() => setStep(i + 1)}
                                >
                                    <View style={[s.stepNum, step > i && { backgroundColor: theme().primary }]}>
                                        {step > i
                                            ? <Ionicons name="checkmark" size={normalize(12)} color={theme().inputBg} />
                                            : <Text style={s.stepNumText}>{i + 1}</Text>
                                        }
                                    </View>
                                    <Text style={[s.stepText, step > i && { color: theme().border }]}>{stepText}</Text>
                                </TouchableOpacity>
                            ))}

                            {selected && step >= (selected.tutorial?.length ?? 0) && step > 0 && (
                                <View style={s.doneCard}>
                                    <Text style={s.doneEmoji}>🎉</Text>
                                    <Text style={s.doneText}>{t('bom_apetite')}</Text>
                                </View>
                            )}

                            <View style={{ height: normalize(40) }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <ModalFilterRecipes
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                onApply={(filters) => setActiveFilters(filters)}
            />
        </View>
    );
}

function get_s() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
        header: { paddingHorizontal: normalize(20), paddingTop: normalize(16), paddingBottom: normalize(8) },
        title: { fontSize: fontSize(7), fontFamily: 'Poppins_600SemiBold', color: theme().text },
        sub: { fontSize: fontSize(3), fontFamily: 'Poppins_600SemiBold', color: theme().border },
        headerBody: { backgroundColor: "transparent", marginHorizontal: normalize(5), marginBottom: normalize(5) },
        bodyBar: { backgroundColor: "transparent", marginBottom: normalize(5), marginHorizontal: normalize(10) },
        bbBar: { backgroundColor: theme().cardBg + 'aa', justifyContent: "center", alignItems: "center", flexDirection: "row", paddingHorizontal: normalize(12), borderRadius: normalize(8) },
        bbInputBar: { color: theme().text, fontFamily: 'Poppins_600SemiBold', fontSize: fontSize(3.5), paddingVertical: normalize(10), flex: 1, marginHorizontal: normalize(8) },
        list: { paddingHorizontal: normalize(16), marginBottom: normalize(navBarHeight) + normalize(20) },
        body2: { flex: 1, marginBottom: normalize(navBarHeight) + normalize(20) },
        smartContainer: { marginBottom: normalize(16) },
        smartHeader: { flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginBottom: normalize(4) },
        smartTitle: { fontSize: fontSize(4.5), fontFamily: 'Poppins_600SemiBold', color: '#f5c518' },
        smartSub: { fontSize: fontSize(3), fontFamily: 'Poppins_600SemiBold', color: theme().textMuted, marginBottom: normalize(12) },
        smartScroll: { gap: normalize(12), paddingRight: normalize(16) },
        smartCard: { backgroundColor: theme().cardBg, borderRadius: normalize(12), padding: normalize(12), width: normalize(140), justifyContent: 'space-between', borderWidth: 1, borderColor: theme().cardBg },
        smartCardName: { fontSize: fontSize(3.2), fontFamily: 'Poppins_600SemiBold', color: theme().text, marginTop: normalize(8) },
        dividerContainer: { paddingVertical: normalize(16) },
        emptySmartContainer: { backgroundColor: theme().cardBg, borderRadius: normalize(12), padding: normalize(20), alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme().cardBg, gap: normalize(10) },
        emptySmartText: { fontSize: fontSize(3.2), fontFamily: 'Poppins_600SemiBold', color: theme().textMuted, textAlign: 'center', lineHeight: fontSize(4.5), paddingHorizontal: normalize(10) },
        emptySmartBtn: { backgroundColor: theme().primary, paddingVertical: normalize(10), paddingHorizontal: normalize(20), borderRadius: normalize(8), marginTop: normalize(5) },
        emptySmartBtnText: { fontSize: fontSize(3), fontFamily: 'Poppins_700Bold', color: theme().bg },
        card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme().cardBg, borderRadius: normalize(10), padding: normalize(14), marginBottom: normalize(8), gap: normalize(12) },
        cardContent: { flex: 1 },
        cardName: { fontSize: fontSize(3.5), fontFamily: 'Poppins_600SemiBold', color: theme().text },
        cardSub: { fontSize: fontSize(2.5), fontFamily: 'Poppins_600SemiBold', color: theme().border, marginTop: normalize(2), textTransform: 'uppercase' },
        badge: { borderRadius: normalize(6), borderWidth: 1, paddingHorizontal: normalize(8), paddingVertical: normalize(3) },
        badgeText: { fontSize: fontSize(3), fontFamily: 'Poppins_600SemiBold' },
        overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
        sheet: { backgroundColor: theme().inputBg, borderTopLeftRadius: normalize(20), borderTopRightRadius: normalize(20), padding: normalize(20), paddingBottom: normalize(navBarHeight) + normalize(20), maxHeight: '90%', gap: normalize(14) },
        sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: normalize(12) },
        sheetIcon: { width: normalize(44), height: normalize(44), borderRadius: normalize(8), backgroundColor: theme().cardBg, justifyContent: 'center', alignItems: 'center' },
        sheetIconText: { fontSize: fontSize(5), fontFamily: 'Poppins_600SemiBold', color: theme().text },
        sheetTitle: { fontSize: fontSize(5), fontFamily: 'Poppins_600SemiBold', color: theme().text },
        divider: { height: 1, backgroundColor: theme().cardBg },
        sectionLabel: { fontSize: fontSize(2.5), fontFamily: 'Poppins_600SemiBold', color: theme().border, letterSpacing: 1, marginBottom: normalize(10), marginTop: normalize(4) },
        ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: normalize(10), marginBottom: normalize(8) },
        dot: { width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: theme().primary, flexShrink: 0 },
        ingredientText: { flex: 1, fontSize: fontSize(3.2), fontFamily: 'Poppins_600SemiBold', color: theme().textMuted, textTransform: 'capitalize' },
        stepCard: { flexDirection: 'row', alignItems: 'flex-start', gap: normalize(12), backgroundColor: theme().cardBg, borderRadius: normalize(10), padding: normalize(12), marginBottom: normalize(8) },
        stepDone: { backgroundColor: theme().inputBg },
        stepNum: { width: normalize(22), height: normalize(22), borderRadius: normalize(11), backgroundColor: theme().cardBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
        stepNumText: { fontSize: fontSize(2.5), fontFamily: 'Poppins_600SemiBold', color: theme().text },
        stepText: { flex: 1, fontSize: fontSize(3.2), fontFamily: 'Poppins_600SemiBold', color: theme().textMuted, lineHeight: fontSize(5) },
        doneCard: { alignItems: 'center', paddingVertical: normalize(20), gap: normalize(8) },
        doneEmoji: { fontSize: fontSize(10) },
        doneText: { fontSize: fontSize(5), fontFamily: 'Poppins_600SemiBold', color: theme().primary }
    });
}