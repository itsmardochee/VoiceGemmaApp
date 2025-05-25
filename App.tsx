import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    TextInput,
    Modal,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { request, PERMISSIONS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LlamaService from './services/LlamaService';
import { pick, keepLocalCopy, types } from '@react-native-documents/picker';

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
        llmInitError: "Erreur lors de l'initialisation du modèle IA",
        llmInitializing: 'Initialisation de Gemma...',
        llmDownloading: 'Téléchargement du modèle...',
        llmResponse: (text) => `Vous avez dit: "${text}". Je suis Gemma 3, votre assistant IA local.`,
        ttsLanguage: 'fr-FR',
        voiceLanguage: 'fr-FR',
        modelManagement: 'Gestion du Modèle',
        selectModel: '📁 Sélectionner Modèle',
        downloadModel: '📥 Télécharger Modèle',
        modelUrl: 'URL du modèle:',
        download: 'Télécharger',
        cancel: 'Annuler',
        currentModel: 'Modèle actuel:',
        noModel: 'Aucun modèle sélectionné',
        modelSelected: 'Modèle sélectionné',
        downloadProgress: 'Téléchargement en cours...',
        downloadComplete: 'Téléchargement terminé',
        downloadError: 'Erreur de téléchargement',
        selectModelError: 'Erreur lors de la sélection du modèle',
        copyingModel: 'Copie du modèle en cours...',
        copyProgress: 'Copie:',
        modelCopied: 'Modèle copié avec succès',
        copyError: 'Erreur lors de la copie du modèle',
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
        llmInitError: 'Error initializing AI model',
        llmInitializing: 'Initializing Gemma...',
        llmDownloading: 'Downloading model...',
        llmResponse: (text) => `You said: "${text}". I am Gemma 3, your local AI assistant.`,
        ttsLanguage: 'en-US',
        voiceLanguage: 'en-US',
        modelManagement: 'Model Management',
        selectModel: '📁 Select Model',
        downloadModel: '📥 Download Model',
        modelUrl: 'Model URL:',
        download: 'Download',
        cancel: 'Cancel',
        currentModel: 'Current model:',
        noModel: 'No model selected',
        modelSelected: 'Model selected',
        downloadProgress: 'Downloading...',
        downloadComplete: 'Download completed',
        downloadError: 'Download error',
        selectModelError: 'Error selecting model',
        copyingModel: 'Copying model...',
        copyProgress: 'Copy:',
        modelCopied: 'Model copied successfully',
        copyError: 'Error copying model',
    }
};

const App = () => {
    const [language, setLanguage] = useState('fr');
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [llmResponse, setLlmResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLlmReady, setIsLlmReady] = useState(false);
    const [llmStatus, setLlmStatus] = useState('');
    const [selectedModelPath, setSelectedModelPath] = useState('');
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    // const [downloadUrl, setDownloadUrl] = useState('https://huggingface.co/lmstudio-community/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q3_K_L.gguf');
    const [downloadUrl, setDownloadUrl] = useState('https://huggingface.co/tensorblock/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q8_0.gguf?download=true');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copyProgress, setCopyProgress] = useState(0);

    const STORAGE_KEYS = {
        SELECTED_MODEL_PATH: '@voice_gemma_selected_model_path',
        SELECTED_MODEL_NAME: '@voice_gemma_selected_model_name',
        IS_LLM_READY: '@voice_gemma_is_llm_ready',
    };

    const t = translations[language];

    const requestPermissions = async () => {
        try {
            console.log('🔒 Permissions: Demande de permission microphone');
            const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
            console.log('🔒 Permissions: Résultat permission microphone:', result);
            
            if (result !== 'granted') {
                Alert.alert(
                    t.micPermissionTitle,
                    t.micPermissionMessage
                );
            }
        } catch (error) {
            console.error('❌ Permissions: Erreur lors de la demande de permission:', error);
        }
    };

    const toggleLanguage = () => {
        const newLanguage = language === 'fr' ? 'en' : 'fr';
        console.log(`🌐 Language: Changement de langue: ${language} -> ${newLanguage}`);
        setLanguage(newLanguage);

        const newTtsLanguage = translations[newLanguage].ttsLanguage;
        Tts.setDefaultLanguage(newTtsLanguage);
        console.log(`🔊 TTS: Langue mise à jour: ${newTtsLanguage}`);
    };

    useEffect(() => {
        console.log('🚀 App: Initialisation des services Voice, TTS et LLM');

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
            // Délai plus long pour s'assurer que le service audio est complètement libéré
            setTimeout(() => {
                setIsSpeaking(false);
                console.log('🔊 TTS: Service audio libéré');
            }, 800);
        });

        Tts.addEventListener('tts-cancel', event => {
            console.log('🔊 TTS: Synthèse annulée', event);
            // Délai plus long pour s'assurer que le service audio est complètement libéré
            setTimeout(() => {
                setIsSpeaking(false);
                console.log('🔊 TTS: Service audio libéré après annulation');
            }, 800);
        });

        // Vérifier s'il y a un modèle sauvegardé
        loadSavedModel();

        requestPermissions();

        return () => {
            console.log('🧹 App: Nettoyage des services');
            Voice.destroy().then(Voice.removeAllListeners);
            Tts.removeAllListeners('tts-start');
            Tts.removeAllListeners('tts-finish');
            Tts.removeAllListeners('tts-cancel');
            LlamaService.cleanup();
        };
    }, [language]);

    // Fonction pour charger le modèle sauvegardé
    const loadSavedModel = async () => {
        try {
            const savedModelPath = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MODEL_PATH);
            const savedModelName = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MODEL_NAME);
            
            if (savedModelPath) {
                console.log('📁 App: Modèle sauvegardé trouvé:', savedModelPath);
                
                // Vérifier si le fichier existe encore
                const LlamaServiceFS = require('./services/LlamaService').default;
                const exists = await LlamaServiceFS.checkFileExists(savedModelPath);
                
                if (exists) {
                    setSelectedModelPath(savedModelPath);
                    console.log('✅ App: Modèle restauré:', savedModelName);
                    
                    // Essayer d'initialiser automatiquement
                    try {
                        setLlmStatus(t.llmInitializing);
                        await LlamaService.initialize(savedModelPath);
                        setIsLlmReady(true);
                        setLlmStatus('');
                        console.log('✅ App: LLM réinitialisé automatiquement');
                    } catch (error) {
                        console.error('❌ App: Erreur lors de la réinitialisation automatique:', error);
                        setLlmStatus(t.noModel);
                        setIsLlmReady(false);
                    }
                } else {
                    console.warn('⚠️ App: Fichier modèle sauvegardé introuvable, nettoyage...');
                    await AsyncStorage.multiRemove([
                        STORAGE_KEYS.SELECTED_MODEL_PATH,
                        STORAGE_KEYS.SELECTED_MODEL_NAME,
                        STORAGE_KEYS.IS_LLM_READY
                    ]);
                    setLlmStatus(t.noModel);
                    setIsLlmReady(false);
                }
            } else {
                console.log('⚠️ App: Aucun modèle sauvegardé trouvé');
                setLlmStatus(t.noModel);
                setIsLlmReady(false);
            }
        } catch (error) {
            console.error('❌ App: Erreur lors du chargement du modèle sauvegardé:', error);
            setLlmStatus(t.noModel);
            setIsLlmReady(false);
        }
    };

    // Fonction pour sauvegarder le modèle
    const saveModelInfo = async (modelPath: string, modelName: string) => {
        try {
            await AsyncStorage.multiSet([
                [STORAGE_KEYS.SELECTED_MODEL_PATH, modelPath],
                [STORAGE_KEYS.SELECTED_MODEL_NAME, modelName],
                [STORAGE_KEYS.IS_LLM_READY, 'true']
            ]);
            console.log('💾 App: Informations du modèle sauvegardées');
        } catch (error) {
            console.error('❌ App: Erreur lors de la sauvegarde:', error);
        }
    };

    const startListening = async () => {
        console.log('▶️ User Action: Bouton "Commencer l\'écoute" pressé');
        
        // Vérifier si TTS est encore en cours
        if (isSpeaking) {
            console.warn('⚠️ Voice: TTS en cours, arrêt avant de commencer l\'écoute');
            try {
                await Tts.stop();
                // Attendre un délai plus long pour que TTS se termine complètement
                await new Promise(resolve => setTimeout(resolve, 1000));
                setIsSpeaking(false);
            } catch (error) {
                console.error('❌ Voice: Erreur lors de l\'arrêt du TTS:', error);
            }
        }
        
        // Délai de sécurité supplémentaire même si TTS n'était pas en cours
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            // Vérifier si Voice est déjà en écoute et nettoyer si nécessaire
            try {
                await Voice.stop();
                await Voice.destroy();
                console.log('🧹 Voice: Services précédents nettoyés');
            } catch (cleanupError) {
                console.log('🧹 Voice: Pas de services précédents à nettoyer');
            }
            
            // Attendre encore un peu avant de redémarrer
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log(`🎤 Voice: Démarrage de la reconnaissance vocale (${t.voiceLanguage})`);
            await Voice.start(t.voiceLanguage);
            console.log('✅ Voice: Service de reconnaissance démarré avec succès');
        } catch (error) {
            console.error('❌ Voice: Erreur lors du démarrage:', error);
            
            // Tentative de récupération avec délai plus long
            try {
                console.log('🔄 Voice: Tentative de récupération avec délai...');
                await Voice.destroy();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await Voice.start(t.voiceLanguage);
                console.log('✅ Voice: Service récupéré avec succès');
            } catch (retryError) {
                console.error('❌ Voice: Échec de la récupération:', retryError);
                Alert.alert(t.errorTitle, t.voiceStartError);
            }
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

    const initializeLLM = async () => {
        try {
            setLlmStatus(t.llmInitializing);
            console.log('🤖 LLM: Début de l\'initialisation');
            console.log('🤖 LLM: Chemin du modèle disponible:', selectedModelPath);
            
            if (!selectedModelPath) {
                console.warn('⚠️ LLM: Aucun modèle sélectionné, tentative avec modèle par défaut...');
                // Essayer d'initialiser avec le modèle par défaut
                await LlamaService.initialize();
                setIsLlmReady(true);
                setLlmStatus('');
                console.log('✅ LLM: Initialisé avec modèle par défaut');
                return;
            }
            
            await LlamaService.initialize(selectedModelPath);
            
            setIsLlmReady(true);
            setLlmStatus('');
            console.log('✅ LLM: Prêt à être utilisé avec:', selectedModelPath);
        } catch (error) {
            console.error('❌ LLM: Erreur d\'initialisation:', error);
            setLlmStatus(t.llmInitError);
            Alert.alert(t.errorTitle, t.llmInitError);
        }
    };

    const selectModelFile = async () => {
        try {
            const [result] = await pick({
                type: [types.allFiles],
            });

            if (result) {
                console.log('📁 Model: Fichier sélectionné:', result.name, 'Taille:', result.size);
                console.log('📁 Model: URI original:', result.uri);
                
                // Vérifier si ce modèle existe déjà
                const targetFileName = result.name ?? 'selected-model.gguf';
                const existingModelPath = await LlamaService.findExistingModel(targetFileName);
                
                if (existingModelPath) {
                    console.log('♻️ Model: Modèle existant trouvé, réutilisation:', existingModelPath);
                    
                    setSelectedModelPath(existingModelPath);
                    setIsLlmReady(false);
                    setLlmResponse('');
                    
                    try {
                        setLlmStatus(t.llmInitializing);
                        await LlamaService.initialize(existingModelPath);
                        
                        setIsLlmReady(true);
                        setLlmStatus('');
                        
                        // Sauvegarder les informations
                        await saveModelInfo(existingModelPath, result.name);
                        
                        Alert.alert(t.modelSelected, `${result.name}\n\nModèle réutilisé (pas de copie nécessaire)\n\nGemma est prêt !`);
                        console.log('✅ Model: LLM initialisé avec modèle existant');
                    } catch (initError) {
                        console.error('❌ Model: Erreur d\'initialisation:', initError);
                        setLlmStatus(t.llmInitError);
                        Alert.alert(t.errorTitle, `Erreur d'initialisation: ${initError.message}`);
                    }
                    return;
                }
                
                // Sinon, procéder à la copie comme avant
                setIsCopying(true);
                setCopyProgress(0);
                setLlmStatus(`${t.copyingModel} 0%`);
                
                const progressInterval = setInterval(() => {
                    setCopyProgress(prev => {
                        const newProgress = Math.min(prev + 0.02, 0.95);
                        setLlmStatus(`${t.copyProgress} ${Math.round(newProgress * 100)}%`);
                        return newProgress;
                    });
                }, 100);

                try {
                    const localCopyResult = await keepLocalCopy({
                        files: [
                            {
                                uri: result.uri,
                                fileName: result.name ?? 'selected-model.gguf',
                            },
                        ],
                        destination: 'documentDirectory',
                    });

                    console.log('📁 Model: Résultat de la copie:', localCopyResult);
                    
                    clearInterval(progressInterval);
                    setCopyProgress(1);
                    setLlmStatus(t.modelCopied);

                    let modelPath;
                    if (Array.isArray(localCopyResult) && localCopyResult.length > 0) {
                        const [localCopy] = localCopyResult;
                        modelPath = localCopy.localUri || localCopy.uri || localCopy.fileCopyUri || localCopy.path;
                    } else {
                        modelPath = localCopyResult.localUri || localCopyResult.uri || localCopyResult.fileCopyUri || localCopyResult.path;
                    }
                    
                    if (!modelPath) {
                        throw new Error('Impossible de déterminer le chemin du fichier copié');
                    }

                    setSelectedModelPath(modelPath);
                    setIsLlmReady(false);
                    setLlmResponse('');
                    
                    setTimeout(async () => {
                        setIsCopying(false);
                        console.log('🚀 Model: Démarrage automatique de l\'initialisation du LLM avec:', modelPath);
                        
                        try {
                            setLlmStatus(t.llmInitializing);
                            await LlamaService.initialize(modelPath);
                            
                            setIsLlmReady(true);
                            setLlmStatus('');
                            
                            // Sauvegarder les informations
                            await saveModelInfo(modelPath, result.name);
                            
                            Alert.alert(t.modelSelected, `${result.name}\n${t.modelCopied}\n\nGemma est prêt à être utilisé !`);
                            console.log('✅ Model: LLM initialisé et prêt');
                        } catch (initError) {
                            console.error('❌ Model: Erreur d\'initialisation automatique:', initError);
                            setLlmStatus(t.llmInitError);
                            Alert.alert(t.errorTitle, `${t.modelCopied}\n\nMais erreur d'initialisation: ${initError.message}`);
                        }
                    }, 1000);
                    
                } catch (copyError) {
                    clearInterval(progressInterval);
                    throw copyError;
                }
            }
        } catch (error) {
            setIsCopying(false);
            setCopyProgress(0);
            setLlmStatus('');
            
            if (error.message && error.message.includes('cancelled')) {
                console.log('📁 Model: Sélection annulée par l\'utilisateur');
            } else {
                console.error('❌ Model: Erreur de sélection/copie:', error);
                Alert.alert(t.errorTitle, `${t.copyError}: ${error.message}`);
            }
        }
    };

    const downloadModel = async () => {
        if (!downloadUrl.trim()) {
            Alert.alert(t.errorTitle, 'URL requise');
            return;
        }

        // Vérifier si le modèle existe déjà
        const fileName = downloadUrl.split('/').pop() || 'downloaded-model.gguf';
        const existingModelPath = await LlamaService.findExistingModel(fileName);
        
        if (existingModelPath) {
            console.log('♻️ Download: Modèle déjà téléchargé, réutilisation:', existingModelPath);
            
            setSelectedModelPath(existingModelPath);
            setShowDownloadModal(false);
            
            try {
                setLlmStatus(t.llmInitializing);
                await LlamaService.initialize(existingModelPath);
                
                setIsLlmReady(true);
                setLlmStatus('');
                
                // Sauvegarder les informations
                await saveModelInfo(existingModelPath, fileName);
                
                Alert.alert(t.modelSelected, `${fileName}\n\nModèle réutilisé (pas de téléchargement nécessaire)\n\nGemma est prêt !`);
                console.log('✅ Download: LLM initialisé avec modèle existant');
            } catch (initError) {
                console.error('❌ Download: Erreur d\'initialisation:', initError);
                setLlmStatus(t.llmInitError);
                Alert.alert(t.errorTitle, `Erreur d'initialisation: ${initError.message}`);
            }
            return;
        }

        // Sinon, procéder au téléchargement
        setIsDownloading(true);
        setDownloadProgress(0);
        setShowDownloadModal(false);

        try {
            const modelPath = await LlamaService.downloadModel(
                downloadUrl,
                (progress) => {
                    setDownloadProgress(progress);
                    setLlmStatus(`${t.downloadProgress} ${Math.round(progress * 100)}%`);
                }
            );

            setSelectedModelPath(modelPath);
            setIsDownloading(false);
            
            console.log('🚀 Download: Démarrage automatique de l\'initialisation du LLM');
            try {
                setLlmStatus(t.llmInitializing);
                await LlamaService.initialize(modelPath);
                
                setIsLlmReady(true);
                setLlmStatus('');
                
                // Sauvegarder les informations
                await saveModelInfo(modelPath, fileName);
                
                Alert.alert(t.downloadComplete, 'Gemma est prêt à être utilisé !');
                console.log('✅ Download: LLM initialisé et prêt');
            } catch (initError) {
                console.error('❌ Download: Erreur d\'initialisation automatique:', initError);
                setLlmStatus(t.llmInitError);
                Alert.alert(t.errorTitle, `${t.downloadComplete}\n\nMais erreur d'initialisation: ${initError.message}`);
            }
            
        } catch (error) {
            setIsDownloading(false);
            setLlmStatus('');
            console.error('❌ Model: Erreur de téléchargement:', error);
            Alert.alert(t.errorTitle, t.downloadError);
        }
    };

    const processWithLLM = async text => {
        console.log('🤖 LLM: Début du traitement du texte:', text);
        console.log('🤖 LLM: État actuel - isLlmReady:', isLlmReady, 'selectedModelPath:', selectedModelPath);
        
        setIsProcessing(true);
        setLlmResponse(''); // Vider la réponse précédente

        try {
            // Vérifier d'abord si le contexte LLM existe
            const isContextReady = LlamaService.isReady();
            console.log('🔍 LLM: Vérification du contexte:', isContextReady);

            if (!isContextReady) {
                console.warn('⚠️ LLM: Contexte non disponible, tentative d\'initialisation...');
                
                if (selectedModelPath) {
                    console.log('🔄 LLM: Réinitialisation avec modèle sélectionné:', selectedModelPath);
                    await LlamaService.initialize(selectedModelPath);
                } else {
                    console.log('🔄 LLM: Tentative d\'initialisation avec modèle par défaut...');
                    await LlamaService.initialize();
                }
                
                setIsLlmReady(true);
                console.log('✅ LLM: Contexte réinitialisé avec succès');
            } else if (!isLlmReady) {
                // Le contexte existe mais l'état n'est pas à jour
                setIsLlmReady(true);
                console.log('✅ LLM: État mis à jour - contexte déjà prêt');
            }

            const messages = [
                {
                    role: 'system' as const,
                    content: language === 'fr' 
                        ? 'Tu es Gemma, un assistant IA concis. Réponds en français en 1-2 phrases maximum.'
                        : 'You are Gemma, a concise AI assistant. Respond in English with 1-2 sentences maximum.'
                },
                {
                    role: 'user' as const,
                    content: text
                }
            ];

            // Ajouter un callback pour afficher la génération en temps réel
            let partialResponse = '';
            const response = await LlamaService.completion(messages, (tokenData) => {
                if (tokenData.token) {
                    partialResponse += tokenData.token;
                    setLlmResponse(partialResponse);
                }
            });
            
            console.log('🤖 LLM: Réponse générée:', response);
            setLlmResponse(response);
            speakResponse(response);
            setIsProcessing(false);

            console.log('✅ LLM: Traitement terminé avec succès');
        } catch (error) {
            console.error('❌ LLM: Erreur lors du traitement:', error);
            setIsProcessing(false);
            
            // Fallback response avec message d'erreur spécifique
            const fallbackResponse = language === 'fr'
                ? `Désolé, erreur: ${error.message}`
                : `Sorry, error: ${error.message}`;
            
            setLlmResponse(fallbackResponse);
            speakResponse(fallbackResponse);
            Alert.alert(t.errorTitle, error.message);
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
                    <Text style={styles.sectionTitle}>{t.modelManagement}</Text>
                    <Text style={styles.modelInfo}>
                        {t.currentModel} {selectedModelPath ? 
                            selectedModelPath.split('/').pop() : t.noModel}
                    </Text>
                    
                    {/* Barre de progression pour la copie */}
                    {isCopying && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View 
                                    style={[styles.progressFill, { width: `${copyProgress * 100}%` }]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {Math.round(copyProgress * 100)}%
                            </Text>
                        </View>
                    )}
                    
                    <View style={styles.modelButtons}>
                        <TouchableOpacity
                            style={[styles.modelButton, (isDownloading || isCopying) && styles.modelButtonDisabled]}
                            onPress={selectModelFile}
                            disabled={isDownloading || isCopying}>
                            <Text style={styles.modelButtonText}>{t.selectModel}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modelButton, (isDownloading || isCopying) && styles.modelButtonDisabled]}
                            onPress={() => setShowDownloadModal(true)}
                            disabled={isDownloading || isCopying}>
                            <Text style={styles.modelButtonText}>{t.downloadModel}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Le bouton d'initialisation manuelle n'est plus nécessaire 
                        car l'initialisation se fait automatiquement */}
                    {selectedModelPath && !isLlmReady && !isCopying && !isDownloading && (
                        <TouchableOpacity
                            style={styles.initButton}
                            onPress={initializeLLM}
                            disabled={false}>
                            <Text style={styles.initButtonText}>🔄 Réinitialiser Gemma</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.youSaid}</Text>
                    <Text style={styles.recognizedText}>
                        {recognizedText || t.pressToSpeak}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.gemmaResponse}</Text>
                    <Text style={styles.responseText}>
                        {!isLlmReady && llmStatus ? llmStatus :
                         isProcessing ? t.gemmaThinking : 
                         llmResponse}
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.micButton, isListening && styles.micButtonActive]}
                    onPress={isListening ? stopListening : startListening}
                    disabled={isProcessing || !isLlmReady || isCopying || isSpeaking}>
                    <Text style={styles.micButtonText}>
                        {isListening ? t.stop : (isSpeaking ? '⏳ Attendre...' : t.speak)}
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

            <Modal
                visible={showDownloadModal}
                transparent={true}
                animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t.downloadModel}</Text>
                        
                        <Text style={styles.inputLabel}>{t.modelUrl}</Text>
                        <TextInput
                            style={styles.urlInput}
                            value={downloadUrl}
                            onChangeText={setDownloadUrl}
                            placeholder="https://..."
                            placeholderTextColor="#666"
                            multiline
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowDownloadModal(false)}>
                                <Text style={styles.modalButtonText}>{t.cancel}</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.downloadButton]}
                                onPress={downloadModel}>
                                <Text style={styles.modalButtonText}>{t.download}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modelInfo: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 15,
    },
    modelButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modelButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        flex: 0.48,
    },
    modelButtonText: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    initButton: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignSelf: 'center',
        marginTop: 10,
    },
    initButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#2a2a2a',
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#4CAF50',
        marginBottom: 8,
    },
    urlInput: {
        backgroundColor: '#1a1a1a',
        color: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 0.45,
    },
    cancelButton: {
        backgroundColor: '#666',
    },
    downloadButton: {
        backgroundColor: '#2196F3',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    progressContainer: {
        marginVertical: 15,
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#444',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modelButtonDisabled: {
        backgroundColor: '#666',
        opacity: 0.6,
    },
});

export default App;
