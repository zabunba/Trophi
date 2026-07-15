import { theme, getThemeId } from '../assets/theme';
import {
    StyleSheet, View, Text, Platform, StatusBar,
    TouchableOpacity, Alert, Modal, TextInput,
    KeyboardAvoidingView, ScrollView, DeviceEventEmitter
} from 'react-native';
import { t } from '../assets/lang';

import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';

import { navBarHeight } from '../dev';
import { fontSize } from '../dev';
import { normalize } from '../dev';
import { getProductByBarcode } from '../dev';
import { insertProduct } from '../dev';
import { extractAndNormalizeDate } from '../dev';
import { extractQuantityFromText } from '../dev';
import { extractTextLocally } from '../dev';
import { processBatchQRCode } from '../dev';

const EMPTY_DRAFT = {
    barcode: '', name: '', category: 'Other', type: 'Unknown',
    nutriScore: 'unknown', validationDate: '', quantity: '1', quantityDetected: false,
};

// gs1 parser
const parseGS1 = (barcode) => {
    const parsedData = {};
    let remaining = barcode.replace(/^\]C1/, '');

    while (remaining.length > 0) {
        if (remaining.charCodeAt(0) === 29) { remaining = remaining.substring(1); continue; }

        if (remaining.startsWith('01')) {
            parsedData.gtin = remaining.substring(2, 16);
            remaining = remaining.substring(16);
        } else if (remaining.startsWith('17')) {
            const rawDate = remaining.substring(2, 8);
            parsedData.expiryDate = `${rawDate.substring(4, 6)}/${rawDate.substring(2, 4)}/20${rawDate.substring(0, 2)}`;
            remaining = remaining.substring(8);
        } else if (remaining.startsWith('10')) {
            const match = remaining.substring(2).match(/^([^\x1D]+)/);
            if (match) { parsedData.lot = match[1]; remaining = remaining.substring(2 + match[1].length); }
            else { parsedData.lot = remaining.substring(2); remaining = ""; }
        } else if (remaining.startsWith('21')) {
            const match = remaining.substring(2).match(/^([^\x1D]+)/);
            if (match) { parsedData.serial = match[1]; remaining = remaining.substring(2 + match[1].length); }
            else { parsedData.serial = remaining.substring(2); remaining = ""; }
        } else if (remaining.startsWith('714')) {
            parsedData.cnp = remaining.substring(3, 10);
            remaining = remaining.substring(10);
        } else { break; }
    }
    return parsedData;
};

export default function ProductInsertion({ navigation }) {
    const s = get_s();

    const [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_700Bold });
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const isProcessing = useRef(false);
    const isFocused = useIsFocused();
    const [localThemeKey, setLocalThemeKey] = useState(0);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('theme_changed', () => setLocalThemeKey(k => k + 1));
        return () => sub.remove();
    }, []);

    const [activeTab, setActiveTab] = useState('STANDARD');
    const [gs1PreviewData, setGs1PreviewData] = useState(null);
    const [step, setStep] = useState('SCAN_BARCODE');
    const [draftProduct, setDraftProduct] = useState(EMPTY_DRAFT);

    const resetFlow = () => {
        setStep('SCAN_BARCODE');
        setDraftProduct(EMPTY_DRAFT);
        setGs1PreviewData(null);
        isProcessing.current = false;
    };

    useEffect(() => { if (!isFocused) resetFlow(); }, [isFocused]);

    if (!fontsLoaded) return <View style={{ justifyContent: 'center', backgroundColor: theme().textMuted, flex: 1 }}><Text style={{ textAlign: 'center' }}>{t('a_carregar_fonte')}</Text></View>;
    if (!permission || !isFocused) return <View style={s.main} />;
    if (!permission.granted) {
        return (
            <View style={s.main}>
                <View style={s.permissionContainer}>
                    <Ionicons name="camera-outline" size={normalize(50)} color={theme().textMuted} />
                    <Text style={s.permissionText}>{t('a_aplica_o_precisa_de_acesso_c_mara_para')}</Text>
                    <TouchableOpacity style={s.permissionBtn} onPress={requestPermission}>
                        <Text style={s.permissionBtnText}>{t('conceder_permiss_o')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }) => {
        if (step !== 'SCAN_BARCODE' || isProcessing.current) return;
        isProcessing.current = true;
        if (type === 'qr' || (data.includes('-') && data.includes('\n'))) {
            setStep('PROCESSING');
            const result = await processBatchQRCode(data);
            Alert.alert('Lote Processado', `${result.success} produto(s) inseridos com sucesso.\n${result.failed} falha(s).`,
                [{ text: 'OK', onPress: () => { resetFlow(); navigation.goBack(); } }]
            );
            isProcessing.current = false;
            return;
        }
        const product = await getProductByBarcode(data);
        if (product) {
            setDraftProduct(prev => ({ ...prev, barcode: data, name: product.name, category: product.category, type: product.type || 'Unknown', nutriScore: product.nutriscore || 'unknown' }));
            setStep('CONFIRM_BARCODE');
        } else { Alert.alert('Não Encontrado', `Produto não reconhecido.`, [{ text: 'OK' }]); }
        isProcessing.current = false;
    };

    const takeQuantityPicture = async () => {
        if (!cameraRef.current || isProcessing.current) return;
        isProcessing.current = true;
        setStep('PROCESSING');
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
            const rawText = await extractTextLocally(photo.uri);
            const detected = extractQuantityFromText(rawText);
            if (detected) {
                setDraftProduct(prev => ({ ...prev, quantity: String(detected), quantityDetected: true }));
                setStep('SCAN_DATE');
            } else { Alert.alert('Quantidade não detetada', 'Tenta novamente.', [{ text: 'OK', onPress: () => setStep('SCAN_QUANTITY') }]); }
        } catch (err) { Alert.alert('Erro', 'Falha ao analisar a imagem.', [{ text: 'OK', onPress: () => setStep('SCAN_QUANTITY') }]); }
        finally { isProcessing.current = false; }
    };

    const takeDatePicture = async () => {
        if (!cameraRef.current || isProcessing.current) return;
        isProcessing.current = true;
        setStep('PROCESSING');
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
            const rawText = await extractTextLocally(photo.uri);
            if (!rawText) { Alert.alert('Aviso', 'Nenhum texto detetado.'); setDraftProduct(prev => ({ ...prev, validationDate: '' })); }
            else {
                const parsedDate = extractAndNormalizeDate(rawText);
                if (parsedDate) setDraftProduct(prev => ({ ...prev, validationDate: parsedDate }));
                else { Alert.alert('Aviso', 'Nenhuma data válida encontrada.'); setDraftProduct(prev => ({ ...prev, validationDate: '' })); }
            }
        } catch (err) { Alert.alert('Erro', 'Falha ao analisar imagem.'); }
        finally { isProcessing.current = false; setStep('MODAL'); }
    };

    const handleSaveProduct = async () => {
        const unitsToSave = parseInt(draftProduct.quantity, 10) || 1;
        await insertProduct(draftProduct.name, draftProduct.barcode, draftProduct.nutriScore, draftProduct.category, draftProduct.type, draftProduct.validationDate, unitsToSave);
        resetFlow(); navigation.goBack();
    };

    const incrementQty = () => setDraftProduct(p => ({ ...p, quantity: String(Number(p.quantity) + 1) }));
    const decrementQty = () => setDraftProduct(p => ({ ...p, quantity: String(Math.max(1, Number(p.quantity) - 1)) }));


    const captureMLKitBarcode = async () => {
        if (!cameraRef.current || isProcessing.current) return;
        isProcessing.current = true;

        try {
            //  processamento imediato
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.3 });

            // imagem para o BarcodeScanner 
            const barcodes = await BarcodeScanning.scan(photo.uri);

            if (barcodes && barcodes.length > 0) {
                // string lida pelo ML Kit
                const rawString = barcodes[0].value;
                const parsed = parseGS1(rawString);

                if (Object.keys(parsed).length > 0) {
                    setGs1PreviewData(parsed);
                } else {
                    Alert.alert('Formato Inválido', 'O código foi lido, mas não parece seguir o formato GS1 Sunrise 2027.');
                }
            } else {
                Alert.alert('Não Detetado', 'Aproxima-te ou foca bem o código DataMatrix e tenta novamente.');
            }
        } catch (err) {
            console.error('Erro no ML Kit Barcode:', err);
            Alert.alert('Erro', 'Falha ao executar o ML Kit.');
        } finally {
            isProcessing.current = false;
        }
    };


    const headerLabel = activeTab === 'GS1' ? 'LEITURA GS1 2D' :
        step === 'SCAN_DATE' ? 'LER DATA' :
            step === 'SCAN_QUANTITY' ? 'LER QUANTIDADE' : 'SCANNER';

    const focusedBoxStyle = [
        s.focusedBox,
        step === 'SCAN_DATE' ? s.focusedBoxDate : null,
        step === 'SCAN_QUANTITY' ? s.focusedBoxQuantity : null,
    ];

    return (
        <View style={s.main}>
            <ExpoStatusBar style={getThemeId() === "light" ? "dark" : "light"} />

            <View style={s.headerContainer}>
                <View style={s.headerTitleRow}>
                    <Text style={s.greetingsText}>{headerLabel}</Text>
                </View>
                <View style={s.tabMenu}>
                    <TouchableOpacity style={[s.tabButton, activeTab === 'STANDARD' && s.tabButtonActive]} onPress={() => { setActiveTab('STANDARD'); resetFlow(); }}>
                        <Text style={[s.tabText, activeTab === 'STANDARD' && s.tabTextActive]}>{t('fluxo_padr_o')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.tabButton, activeTab === 'GS1' && s.tabButtonActive]} onPress={() => { setActiveTab('GS1'); resetFlow(); }}>
                        <Text style={[s.tabText, activeTab === 'GS1' && s.tabTextActive]}>{t('gs1_preview')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={s.body}>
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={activeTab === 'STANDARD' && step === 'SCAN_BARCODE' ? handleBarCodeScanned : undefined}
                    barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
                />

                <View style={[StyleSheet.absoluteFillObject, s.overlay]} pointerEvents="box-none">

                    {activeTab === 'STANDARD' && (
                        <>
                            <View style={s.unfocused} />
                            <View style={s.middleRow} pointerEvents="box-none">
                                <View style={s.unfocused} />
                                <View style={focusedBoxStyle}>
                                    {step === 'CONFIRM_BARCODE' && (
                                        <View style={s.resultBox}>
                                            <Text style={s.resultName} numberOfLines={2}>{draftProduct.name}</Text>
                                            <Text style={s.resultCat}>{draftProduct.category}</Text>
                                        </View>
                                    )}
                                    {step === 'SCAN_QUANTITY' && (
                                        <>
                                            <Text style={s.qtyInstruction}>{t('aponte_para_a_embalagem')}</Text>
                                            <Text style={s.qtyHint}>{t('ex_4x125g_8x70g_pack_of_6')}</Text>
                                        </>
                                    )}
                                    {step === 'SCAN_DATE' && (
                                        <Text style={s.dateInstruction}>{t('aponte_para_a_data_de_validade')}</Text>
                                    )}
                                </View>
                                <View style={s.unfocused} />
                            </View>

                            <View style={s.unfocused} pointerEvents="box-none">
                                {step === 'CONFIRM_BARCODE' && (
                                    <View style={s.actionRow}>
                                        <TouchableOpacity style={[s.actionBtn, s.btnCancel]} onPress={resetFlow}><Text style={s.actionBtnText}>{t('novo_scan')}</Text></TouchableOpacity>
                                        <TouchableOpacity style={[s.actionBtn, s.btnConfirm]} onPress={() => setStep('SCAN_QUANTITY')}><Text style={[s.actionBtnText, { color: theme().bg }]}>{t('continuar')}</Text></TouchableOpacity>
                                    </View>
                                )}
                                {step === 'SCAN_QUANTITY' && (
                                    <View style={s.actionRow}>
                                        <TouchableOpacity style={[s.actionBtn, s.btnCancel]} onPress={() => setStep('SCAN_DATE')}><Text style={s.actionBtnText}>{t('s_embalagem')}</Text></TouchableOpacity>
                                        <TouchableOpacity style={[s.actionBtn, s.btnQty]} onPress={takeQuantityPicture}><Text style={[s.actionBtnText, { color: theme().bg }]}>{t('ler_quantidade')}</Text></TouchableOpacity>
                                    </View>
                                )}
                                {step === 'SCAN_DATE' && (
                                    <View style={s.actionRow}>
                                        <TouchableOpacity style={[s.actionBtn, s.btnCancel]} onPress={() => setStep('MODAL')}><Text style={s.actionBtnText}>{t('inserir_manual')}</Text></TouchableOpacity>
                                        <TouchableOpacity style={[s.actionBtn, s.btnConfirm]} onPress={takeDatePicture}><Text style={[s.actionBtnText, { color: theme().bg }]}>{t('capturar_data')}</Text></TouchableOpacity>
                                    </View>
                                )}
                                {step === 'PROCESSING' && (
                                    <View style={s.actionRow}>
                                        <Text style={s.processingText}>{t('a_processar_dados')}</Text>
                                    </View>
                                )}
                            </View>
                        </>
                    )}

                    {activeTab === 'GS1' && (
                        <View style={s.gs1Container} pointerEvents="box-none">
                            {!gs1PreviewData ? (
                                <View style={s.gs1TargetWrapper}>
                                    <View style={s.gs1TargetBox}>
                                        <View style={s.gs1ScannerCorners} />
                                        <Text style={s.gs1ScanHint}>{t('foque_bem_o_datamatrix_e_capture')}</Text>
                                    </View>

                                    <View style={s.mlKitButtonContainer}>
                                        <TouchableOpacity
                                            style={[s.actionBtn, s.btnConfirm, { paddingHorizontal: normalize(40) }]}
                                            onPress={captureMLKitBarcode}
                                            disabled={isProcessing.current}
                                        >
                                            <Ionicons name="barcode-outline" size={normalize(22)} color={theme().bg} />
                                            <Text style={[s.actionBtnText, { color: theme().bg, marginLeft: normalize(8) }]}>
                                                {isProcessing.current ? t('a_ler') : t('ler_codigo_gs1')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={s.gs1PreviewCard}>
                                    <Text style={s.gs1CardTitle}>{t('dados_gs1_extra_dos')}</Text>

                                    <View style={s.gs1DataRow}>
                                        <Text style={s.gs1DataLabel}>{t('gtin')}</Text>
                                        <Text style={s.gs1DataValue}>{gs1PreviewData.gtin || 'N/A'}</Text>
                                    </View>
                                    <View style={s.gs1DataRow}>
                                        <Text style={s.gs1DataLabel}>{t('validade')}</Text>
                                        <Text style={[s.gs1DataValue, { color: '#f5a210' }]}>{gs1PreviewData.expiryDate || 'N/A'}</Text>
                                    </View>
                                    <View style={s.gs1DataRow}>
                                        <Text style={s.gs1DataLabel}>{t('lote')}</Text>
                                        <Text style={s.gs1DataValue}>{gs1PreviewData.lot || 'N/A'}</Text>
                                    </View>
                                    <View style={s.gs1DataRow}>
                                        <Text style={s.gs1DataLabel}>{t('n_s_rie')}</Text>
                                        <Text style={s.gs1DataValue}>{gs1PreviewData.serial || 'N/A'}</Text>
                                    </View>

                                    <TouchableOpacity style={s.gs1ClearBtn} onPress={() => setGs1PreviewData(null)}>
                                        <Text style={s.gs1ClearBtnText}>{t('limpar_e_ler_novo')}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                </View>
            </View>

            <Modal visible={step === 'MODAL' && activeTab === 'STANDARD'} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>{t('confirmar_produto')}</Text>
                            <TouchableOpacity onPress={() => setStep('SCAN_DATE')}><Ionicons name="close" size={normalize(24)} color={theme().textMuted} /></TouchableOpacity>
                        </View>
                        <ScrollView style={{ marginVertical: normalize(15) }}>
                            <View style={s.inputGroup}>
                                <Text style={s.inputLabel}>{t('nome_do_produto')}</Text>
                                <TextInput
                                    style={s.textInput}
                                    value={draftProduct.name}
                                    onChangeText={t => setDraftProduct(p => ({ ...p, name: t }))}
                                />
                            </View>
                            <View style={s.inputGroup}>
                                <View style={s.labelRow}>
                                    <Text style={s.inputLabel}>{t('quantidade')}</Text>
                                    {draftProduct.quantityDetected && (
                                        <View style={s.detectedBadge}>
                                            <Ionicons name="scan" size={normalize(11)} color={theme().text} />
                                            <Text style={s.detectedBadgeText}>Detetada automaticamente</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={s.quantityContainer}>
                                    <TouchableOpacity style={s.qtyBtn} onPress={decrementQty}>
                                        <Ionicons name="remove" size={normalize(20)} color={theme().text} />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={s.qtyInput}
                                        value={draftProduct.quantity}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        onChangeText={t =>
                                            setDraftProduct(p => ({
                                                ...p,
                                                quantity: t.replace(/[^0-9]/g, ''),
                                                quantityDetected: false,
                                            }))
                                        }
                                    />
                                    <TouchableOpacity style={s.qtyBtn} onPress={incrementQty}>
                                        <Ionicons name="add" size={normalize(20)} color={theme().text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={s.inputGroup}>
                                <Text style={s.inputLabel}>{t('data_de_validade')} (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={[s.textInput, { color: theme().primary, fontFamily: 'Poppins_700Bold' }]}
                                    value={draftProduct.validationDate}
                                    placeholder="Ex: 2026-10-15"
                                    placeholderTextColor={theme().textMuted}
                                    onChangeText={t => setDraftProduct(p => ({ ...p, validationDate: t }))}
                                />
                            </View>
                            <View style={s.inputGroup}>
                                <Text style={s.inputLabel}>Categoria</Text>
                                <TextInput
                                    style={s.textInput}
                                    value={draftProduct.category}
                                    onChangeText={t => setDraftProduct(p => ({ ...p, category: t }))}
                                />
                            </View>
                            <View style={s.inputGroup}>
                                <Text style={s.inputLabel}>Tipo</Text>
                                <TextInput
                                    style={s.textInput}
                                    value={draftProduct.type}
                                    onChangeText={t => setDraftProduct(p => ({ ...p, type: t }))}
                                />
                            </View>
                        </ScrollView>
                        <TouchableOpacity style={s.btnSaveFinal} onPress={handleSaveProduct}>
                            <Text style={s.btnSaveFinalText}>{t('guardar_produto_s')}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

function get_s() {
    return StyleSheet.create({
        main: { flex: 1, backgroundColor: theme().bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, paddingBottom: Platform.OS === 'android' ? navBarHeight : 0 },
        headerContainer: { flex: 1.2, paddingHorizontal: normalize(15), paddingTop: normalize(10), justifyContent: 'space-between', zIndex: 10 },
        headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
        greetingsText: { fontSize: fontSize(6), fontFamily: 'Poppins_600SemiBold', color: theme().text },
        tabMenu: { flexDirection: 'row', backgroundColor: theme().cardBg, borderRadius: normalize(8), padding: normalize(4), marginBottom: normalize(10) },
        tabButton: { flex: 1, paddingVertical: normalize(8), alignItems: 'center', borderRadius: normalize(6) },
        tabButtonActive: { backgroundColor: theme().border },
        tabText: { fontFamily: 'Poppins_600SemiBold', color: theme().textMuted, fontSize: fontSize(2.5) },
        tabTextActive: { color: theme().primary },
        body: { flex: 9, backgroundColor: '#000', position: 'relative', borderTopLeftRadius: normalize(20), borderTopRightRadius: normalize(20), overflow: 'hidden' },
        overlay: { zIndex: 5 },
        unfocused: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
        middleRow: { flexDirection: 'row', height: normalize(250) },
        focusedBox: { width: normalize(250), borderColor: theme().primary, borderWidth: 2, borderRadius: normalize(10), justifyContent: 'center', alignItems: 'center' },
        focusedBoxDate: { height: normalize(100), alignSelf: 'center', borderColor: '#f5a210' },
        focusedBoxQuantity: { height: normalize(140), alignSelf: 'center', borderColor: '#a78bfa' },
        qtyInstruction: { position: 'absolute', top: normalize(-30), color: '#a78bfa', fontFamily: 'Poppins_700Bold', fontSize: fontSize(3) },
        qtyHint: { color: '#a78bfa99', fontFamily: 'Poppins_600SemiBold', fontSize: fontSize(2.2), textAlign: 'center', paddingHorizontal: normalize(10) },
        dateInstruction: { position: 'absolute', top: normalize(-30), color: '#f5a210', fontFamily: 'Poppins_700Bold', fontSize: fontSize(3) },
        resultBox: { position: 'absolute', bottom: normalize(-80), backgroundColor: theme().inputBg, padding: normalize(15), borderRadius: normalize(10), width: '120%', alignItems: 'center', borderWidth: 1, borderColor: theme().cardBg },
        resultName: { fontFamily: 'Poppins_700Bold', color: theme().primary, fontSize: fontSize(3.5), textAlign: 'center' },
        resultCat: { fontFamily: 'Poppins_600SemiBold', color: theme().textMuted, fontSize: fontSize(2.5), marginTop: normalize(2) },
        actionRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', paddingHorizontal: normalize(20) },
        actionBtn: { flexDirection: 'row', paddingHorizontal: normalize(20), paddingVertical: normalize(12), borderRadius: normalize(10), alignItems: 'center', justifyContent: 'center', gap: normalize(8), minWidth: normalize(140) },
        btnCancel: { backgroundColor: theme().cardBg, borderWidth: 1, borderColor: theme().border },
        btnConfirm: { backgroundColor: theme().primary },
        btnQty: { backgroundColor: '#a78bfa' },
        actionBtnText: { fontFamily: 'Poppins_700Bold', color: theme().text, fontSize: fontSize(3) },
        processingText: { fontFamily: 'Poppins_600SemiBold', color: theme().textMuted, fontSize: fontSize(3) },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: theme().inputBg, borderTopLeftRadius: normalize(20), borderTopRightRadius: normalize(20), padding: normalize(20), paddingBottom: normalize(40), maxHeight: '80%' },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme().cardBg, paddingBottom: normalize(10) },
        modalTitle: { fontFamily: 'Poppins_700Bold', color: theme().text, fontSize: fontSize(4.5) },
        inputGroup: { marginBottom: normalize(15) },
        labelRow: { flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginBottom: normalize(5) },
        inputLabel: { fontFamily: 'Poppins_600SemiBold', color: theme().textMuted, fontSize: fontSize(2.5), textTransform: 'uppercase' },
        detectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme().primary + '33', borderRadius: normalize(20), paddingHorizontal: normalize(7), paddingVertical: normalize(2), gap: normalize(4) },
        detectedBadgeText: { fontFamily: 'Poppins_600SemiBold', color: theme().primary, fontSize: fontSize(2) },
        textInput: { backgroundColor: theme().cardBg, color: theme().text, fontFamily: 'Poppins_600SemiBold', fontSize: fontSize(3.5), padding: normalize(12), borderRadius: normalize(8), borderWidth: 1, borderColor: theme().border },
        quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: normalize(10) },
        qtyBtn: { backgroundColor: theme().cardBg, padding: normalize(12), borderRadius: normalize(8), alignItems: 'center', justifyContent: 'center', width: normalize(50), borderWidth: 1, borderColor: theme().border },
        qtyInput: { flex: 1, backgroundColor: theme().cardBg, color: theme().primary, fontFamily: 'Poppins_700Bold', fontSize: fontSize(4), padding: normalize(12), borderRadius: normalize(8), borderWidth: 1, borderColor: theme().border, textAlign: 'center' },
        btnSaveFinal: { backgroundColor: theme().primary, padding: normalize(15), borderRadius: normalize(10), alignItems: 'center', marginTop: normalize(10) },
        btnSaveFinalText: { fontFamily: 'Poppins_700Bold', color: theme().bg, fontSize: fontSize(4) },
        permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: normalize(20), gap: normalize(15) },
        permissionText: { fontFamily: 'Poppins_600SemiBold', color: theme().text, fontSize: fontSize(3.5), textAlign: 'center' },
        permissionBtn: { backgroundColor: theme().primary, paddingHorizontal: normalize(20), paddingVertical: normalize(10), borderRadius: normalize(8) },
        permissionBtnText: { fontFamily: 'Poppins_700Bold', color: theme().bg, fontSize: fontSize(3) },
        gs1Container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
        gs1TargetWrapper: { alignItems: 'center', justifyContent: 'center' },
        gs1TargetBox: { width: normalize(220), height: normalize(220), borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
        gs1ScannerCorners: { ...StyleSheet.absoluteFillObject, borderWidth: 4, borderColor: '#4da6ff', borderStyle: 'dashed', borderRadius: normalize(15) },
        gs1ScanHint: { color: theme().text, fontFamily: 'Poppins_600SemiBold', fontSize: fontSize(3), marginTop: normalize(280), position: 'absolute', width: normalize(300), textAlign: 'center' },
        mlKitButtonContainer: { marginTop: normalize(90) },
        gs1PreviewCard: { backgroundColor: theme().inputBg, padding: normalize(20), borderRadius: normalize(12), width: '85%', borderWidth: 1, borderColor: theme().cardBg, elevation: 5 },
        gs1CardTitle: { color: theme().text, fontFamily: 'Poppins_700Bold', fontSize: fontSize(4.5), marginBottom: normalize(15), borderBottomWidth: 1, borderBottomColor: theme().cardBg, paddingBottom: normalize(10), textAlign: 'center' },
        gs1DataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: normalize(10), alignItems: 'center' },
        gs1DataLabel: { color: theme().textMuted, fontFamily: 'Poppins_600SemiBold', fontSize: fontSize(2.8) },
        gs1DataValue: { color: theme().text, fontFamily: 'Poppins_700Bold', fontSize: fontSize(3) },
        gs1ClearBtn: { backgroundColor: theme().cardBg, padding: normalize(12), borderRadius: normalize(8), alignItems: 'center', marginTop: normalize(20), borderWidth: 1, borderColor: theme().border },
        gs1ClearBtnText: { color: theme().text, fontFamily: 'Poppins_600SemiBold', fontSize: fontSize(3) }
    });
}