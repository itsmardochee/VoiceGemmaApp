import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { request, PERMISSIONS } from 'react-native-permissions';

const translations = {
    fr: {
        title: '🎤 Voice Gemma',
        subtitle: 'Assistant IA Local',
        youSaid: 'Vous avez dit:',
        pressToSpeak: 'Appuyez sur le micro pour parler...',
        gemmaResponse: 'Réponse Gemma:',
        gemmaThinking: 'Gemma réfléchit...',
        speak: '🎤 Parler',
        stop: '🛑 Stop',
        replay: '🔊 Rejouer',
        stopReading: '⏹️ Arrêter',
        errorTitle: 'Erreur',
        voiceError: 'Problème avec la reconnaissance vocale',
        micPermissionTitle: 'Permission requise',
        micPermissionMessage: "L'accès au microphone est nécessaire pour utiliser l'application",
        voiceStartError: 'Impossible de démarrer la reconnaissance vocale',
        llmError: "Problème lors du traitement par l'IA",
        llmResponse: (text) => `Vous avez dit: "${text}". Je suis Gemma 3, votre assistant IA local.`,
        ttsLanguage: 'fr-FR',
        voiceLanguage: 'fr-FR'
    },
    en: {
        title: '🎤 Voice Gemma',
        subtitle: 'Local AI Assistant',
        youSaid: 'You said:',
        pressToSpeak: 'Press the microphone to speak...',
        gemmaResponse: 'Gemma Response:',
        gemmaThinking: 'Gemma is thinking...',
        speak: '🎤 Speak',
        stop: '🛑 Stop',
        replay: '🔊 Replay',
        stopReading: '⏹️ Stop',
        errorTitle: 'Error',
        voiceError: 'Problem with voice recognition',
        micPermissionTitle: 'Permission Required',
        micPermissionMessage: 'Microphone access is required to use the application',
        voiceStartError: 'Unable to start voice recognition',
        llmError: 'Problem during AI processing',
        llmResponse: (text) => `You said: "${text}". I am Gemma 3, your local AI assistant.`,
        ttsLanguage: 'en-US',
        voiceLanguage: 'en-US'
    }
};

const App = () => {
    const [language, setLanguage] = useState('fr');
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [llmResponse, setLlmResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const t = translations[language];

    const toggleLanguage = () => {
        const newLanguage = language === 'fr' ? 'en' : 'fr';
        console.log(`🌐 Language: Changement de langue: ${language} -> ${newLanguage}`);
        setLanguage(newLanguage);

        const newTtsLanguage = translations[newLanguage].ttsLanguage;
        Tts.setDefaultLanguage(newTtsLanguage);
        console.log(`🔊 TTS: Langue mise à jour: ${newTtsLanguage}`);
    };

    useEffect(() => {
        console.log('🚀 App: Initialisation des services Voice et TTS');

        // Configuration Voice
        Voice.onSpeechStart = e => {
            console.log("🎤 Voice: Début de l'écoute", e);
            setIsListening(true);
        };

        Voice.onSpeechEnd = e => {
            console.log("🎤 Voice: Fin de l'écoute", e);
            setIsListening(false);
        };

        Voice.onSpeechResults = e => {
            const text = e.value[0];
            console.log('🎤 Voice: Résultats de reconnaissance:', {
                allResults: e.value,
                selectedText: text,
            });
            setRecognizedText(text);
            processWithLLM(text);
        };

        Voice.onSpeechError = e => {
            console.error('❌ Voice: Erreur de reconnaissance:', e);
            setIsListening(false);
            Alert.alert(t.errorTitle, t.voiceError);
        };

        Voice.onSpeechPartialResults = e => {
            console.log('🎤 Voice: Résultats partiels:', e.value);
        };

        Voice.onSpeechVolumeChanged = e => {
            console.log('🔊 Voice: Volume changé:', e.value);
        };

        // Configuration TTS
        console.log('🔊 TTS: Configuration de la synthèse vocale');
        Tts.setDefaultLanguage(t.ttsLanguage);
        Tts.setDefaultRate(0.5);

        // Événements TTS
        Tts.addEventListener('tts-start', event => {
            console.log('🔊 TTS: Début de la synthèse', event);
            setIsSpeaking(true);
        });

        Tts.addEventListener('tts-finish', event => {
            console.log('🔊 TTS: Fin de la synthèse', event);
            setIsSpeaking(false);
        });

        Tts.addEventListener('tts-cancel', event => {
            console.log('🔊 TTS: Synthèse annulée', event);
            setIsSpeaking(false);
        });

        requestPermissions();

        return () => {
            console.log('🧹 App: Nettoyage des services');
            Voice.destroy().then(Voice.removeAllListeners);
            Tts.removeAllListeners('tts-start');
            Tts.removeAllListeners('tts-finish');
            Tts.removeAllListeners('tts-cancel');
        };
    }, [language]);

    const requestPermissions = async () => {
        console.log('🔐 Permissions: Demande des permissions audio');
        try {
            const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
            console.log('🔐 Permissions: Résultat:', result);

            if (result === 'granted') {
                console.log('✅ Permissions: Audio accordée');
            } else {
                console.warn('⚠️ Permissions: Audio refusée ou limitée');
                Alert.alert(t.micPermissionTitle, t.micPermissionMessage);
            }
        } catch (error) {
            console.error('❌ Permissions: Erreur lors de la demande:', error);
        }
    };

    const startListening = async () => {
        console.log('▶️ User Action: Bouton "Commencer l\'écoute" pressé');
        try {
            console.log(`🎤 Voice: Démarrage de la reconnaissance vocale (${t.voiceLanguage})`);
            await Voice.start(t.voiceLanguage);
            console.log('✅ Voice: Service de reconnaissance démarré avec succès');
        } catch (error) {
            console.error('❌ Voice: Erreur lors du démarrage:', error);
            Alert.alert(t.errorTitle, t.voiceStartError);
        }
    };

    const stopListening = async () => {
        console.log('⏹️ User Action: Bouton "Arrêter l\'écoute" pressé');
        try {
            console.log('🎤 Voice: Arrêt de la reconnaissance vocale');
            await Voice.stop();
            console.log('✅ Voice: Service de reconnaissance arrêté avec succès');
        } catch (error) {
            console.error("❌ Voice: Erreur lors de l'arrêt:", error);
        }
    };

    const processWithLLM = async text => {
        console.log('🤖 LLM: Début du traitement du texte:', text);
        setIsProcessing(true);

        try {
            // TODO: Intégrer Gemma 3 4B ici
            console.log('🤖 LLM: Simulation du traitement (2 secondes)...');

            setTimeout(() => {
                const mockResponse = t.llmResponse(text);
                console.log('🤖 LLM: Réponse générée:', mockResponse);

                setLlmResponse(mockResponse);
                speakResponse(mockResponse);
                setIsProcessing(false);

                console.log('✅ LLM: Traitement terminé avec succès');
            }, 2000);
        } catch (error) {
            console.error('❌ LLM: Erreur lors du traitement:', error);
            setIsProcessing(false);
            Alert.alert(t.errorTitle, t.llmError);
        }
    };

    const speakResponse = text => {
        console.log(
            '🔊 TTS: Début de la synthèse vocale pour:',
            text.substring(0, 50) + '...',
        );
        try {
            Tts.speak(text);
            console.log('✅ TTS: Commande de synthèse envoyée');
        } catch (error) {
            console.error('❌ TTS: Erreur lors de la synthèse:', error);
        }
    };

    const stopSpeaking = () => {
        console.log('⏹️ User Action: Bouton "Arrêter lecture" pressé');
        try {
            Tts.stop();
            console.log('✅ TTS: Lecture arrêtée');
        } catch (error) {
            console.error('❌ TTS: Erreur lors de l\'arrêt:', error);
        }
    };

    const handleReplayPress = () => {
        if (isSpeaking) {
            console.log('🔄 User Action: Bouton "Arrêter" pressé');
            stopSpeaking();
        } else {
            console.log('🔄 User Action: Bouton "Rejouer" pressé');
            speakResponse(llmResponse);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t.title}</Text>
                        <Text style={styles.subtitle}>{t.subtitle}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.languageButton}
                        onPress={toggleLanguage}
                    >
                        <Text style={styles.flagText}>
                            {language === 'fr' ? '🇫🇷' : '🇺🇸'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.youSaid}</Text>
                    <Text style={styles.recognizedText}>
                        {recognizedText || t.pressToSpeak}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.gemmaResponse}</Text>
                    <Text style={styles.responseText}>
                        {isProcessing ? t.gemmaThinking : llmResponse}
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.micButton, isListening && styles.micButtonActive]}
                    onPress={isListening ? stopListening : startListening}
                    disabled={isProcessing}>
                    <Text style={styles.micButtonText}>
                        {isListening ? t.stop : t.speak}
                    </Text>
                </TouchableOpacity>

                {llmResponse ? (
                    <TouchableOpacity
                        style={[styles.replayButton, isSpeaking && styles.stopButton]}
                        onPress={handleReplayPress}>
                        <Text style={styles.replayButtonText}>
                            {isSpeaking ? t.stopReading : t.replay}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        backgroundColor: '#1a1a1a',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 5,
    },
    languageButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#333',
    },
    flagText: {
        fontSize: 24,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 30,
        padding: 15,
        backgroundColor: '#2a2a2a',
        borderRadius: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 10,
    },
    recognizedText: {
        fontSize: 18,
        color: '#fff',
        lineHeight: 24,
    },
    responseText: {
        fontSize: 16,
        color: '#e0e0e0',
        lineHeight: 22,
    },
    controls: {
        padding: 20,
        alignItems: 'center',
    },
    micButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginBottom: 10,
    },
    micButtonActive: {
        backgroundColor: '#f44336',
    },
    micButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    replayButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    stopButton: {
        backgroundColor: '#FF9800',
    },
    replayButtonText: {
        color: '#fff',
        fontSize: 14,
    },
});

export default App;
