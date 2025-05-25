import {initLlama} from 'llama.rn';
import {LlamaContext, RNLlamaOAICompatibleMessage, TokenData} from 'llama.rn';
import FS from 'react-native-fs2/src';

class LlamaService {
  private context: LlamaContext | null = null;

  async downloadModel(
    url: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    try {
      const filename = url.split('/').pop() || 'downloaded-model.gguf';
      const downloadPath = `${FS.DocumentDirectoryPath}/${filename}`;

      console.log('📥 LLM: Début du téléchargement:', url);

      const {promise} = FS.downloadFile({
        fromUrl: url,
        toFile: downloadPath,
        progress: status => {
          const progress = status.bytesWritten / status.contentLength;
          console.log('📥 LLM: Progression:', Math.round(progress * 100) + '%');
          onProgress?.(progress);
        },
      });

      await promise;
      console.log('✅ LLM: Téléchargement terminé:', downloadPath);
      return downloadPath;
    } catch (error) {
      console.error('❌ LLM: Erreur de téléchargement:', error);
      throw error;
    }
  }

  async initialize(customModelPath?: string) {
    try {
      console.log('🚀 LLM: Initialisation du service...');
      console.log('🔍 LLM: Chemin du modèle fourni:', customModelPath);

      let modelPath = customModelPath;

      if (!modelPath) {
        console.log(
          '⚠️ LLM: Aucun chemin personnalisé, recherche du modèle par défaut...',
        );
        modelPath = await this.prepareDefaultModel();
      }

      console.log("📁 LLM: Vérification de l'existence du modèle:", modelPath);

      // Vérifier que le fichier existe
      const exists = await FS.exists(modelPath);
      if (!exists) {
        console.error('❌ LLM: Fichier modèle introuvable:', modelPath);
        throw new Error(`Modèle non trouvé: ${modelPath}`);
      }

      console.log(
        '✅ LLM: Fichier modèle trouvé, taille:',
        await this.getFileSize(modelPath),
      );
      console.log('📁 LLM: Utilisation du modèle:', modelPath);

      // Paramètres optimisés pour Samsung S24 Ultra
      this.context = await initLlama({
        model: modelPath,
        use_mlock: true,
        n_ctx: 1024, // Réduit pour des réponses plus rapides
        n_gpu_layers: 99, // Utilise au maximum le GPU du S24 Ultra
        n_threads: 8, // Utilise tous les cœurs performance du S24 Ultra
        n_batch: 64, // Traitement par batch plus efficace
      });

      console.log(
        '✅ LLM: Service initialisé avec succès avec paramètres optimisés',
      );
    } catch (error) {
      console.error("❌ LLM: Erreur lors de l'initialisation:", error);
      throw error;
    }
  }

  private async prepareDefaultModel(): Promise<string> {
    const MODEL_FILENAME = 'gemma-3-4b-it-Q8_0.gguf';
    const BUNDLED_MODEL_PATH = `${FS.MainBundlePath}/${MODEL_FILENAME}`;
    const LOCAL_MODEL_PATH = `${FS.DocumentDirectoryPath}/${MODEL_FILENAME}`;

    try {
      // Vérifier si le modèle existe déjà dans le dossier Documents
      const localExists = await FS.exists(LOCAL_MODEL_PATH);
      if (localExists) {
        console.log('✅ LLM: Modèle par défaut trouvé dans le stockage local');
        return LOCAL_MODEL_PATH;
      }

      // Vérifier si le modèle existe dans le bundle de l'app
      const bundledExists = await FS.exists(BUNDLED_MODEL_PATH);
      if (bundledExists) {
        console.log('📦 LLM: Copie du modèle depuis le bundle...');
        await FS.copyFile(BUNDLED_MODEL_PATH, LOCAL_MODEL_PATH);
        console.log('✅ LLM: Modèle copié avec succès');
        return LOCAL_MODEL_PATH;
      }

      throw new Error(
        'Aucun modèle par défaut trouvé. Veuillez sélectionner ou télécharger un modèle.',
      );
    } catch (err) {
      console.error(
        '❌ LLM: Erreur lors de la préparation du modèle par défaut:',
        err,
      );
      throw err;
    }
  }

  private async getFileSize(filePath: string): Promise<string> {
    try {
      const stat = await FS.stat(filePath);
      const sizeMB = Math.round(stat.size / (1024 * 1024));
      return `${sizeMB} MB`;
    } catch {
      return 'Taille inconnue';
    }
  }

  async completion(
    messages: RNLlamaOAICompatibleMessage[],
    onPartialCompletion?: (data: TokenData) => void,
  ) {
    try {
      if (!this.context) {
        throw new Error('LLM context not initialized');
      }

      console.log('🤖 LLM: Génération de la réponse...');
      const res = await this.context.completion(
        {
          messages,
          n_predict: 100, // Encore plus court pour éviter les répétitions
          temperature: 0.8,
          top_k: 40,
          top_p: 0.9,
          ignore_eos: false,
          stop: [
            '<end_of_turn>',
            '<|end_of_text|>',
            '<|endoftext|>',
            '</s>',
            '<eos>',
            '\n\n\n',
            'User:',
            'Human:',
            'Assistant:',
          ],
        },
        onPartialCompletion,
      );

      let response = res?.text?.trim() ?? 'Aucune réponse générée';

      // Nettoyer la réponse des tokens indésirables
      response = this.cleanResponse(response);

      console.log(
        '✅ LLM: Réponse générée et nettoyée:',
        response.substring(0, 100) + '...',
      );
      return response;
    } catch (err) {
      console.error('❌ LLM: Erreur lors de la génération:', err);
      throw err;
    }
  }

  private cleanResponse(text: string): string {
    // Supprimer tous les tokens de fin répétitifs
    const cleanPatterns = [
      /<end_of_turn>/g,
      /<\|end_of_text\|>/g,
      /<\|endoftext\|>/g,
      /<\/s>/g,
      /<eos>/g,
      /\n\n+/g, // Supprimer les multiples sauts de ligne
    ];

    let cleaned = text;

    // Appliquer tous les patterns de nettoyage
    cleanPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Supprimer les espaces en début et fin
    cleaned = cleaned.trim();

    // Si le texte est vide après nettoyage, retourner un message par défaut
    if (!cleaned || cleaned.length === 0) {
      return "Je n'ai pas pu générer une réponse claire.";
    }

    // Limiter à la première phrase complète si la réponse est trop longue
    const sentences = cleaned.split(/[.!?]+/);
    if (sentences.length > 2 && sentences[0].length > 10) {
      return sentences[0].trim() + '.';
    }

    return cleaned;
  }

  async cleanup() {
    try {
      if (this.context) {
        await this.context.release();
        this.context = null;
        console.log('🧹 LLM: Service nettoyé');
      }
    } catch (error) {
      console.error('❌ LLM: Erreur lors du nettoyage:', error);
    }
  }

  isReady(): boolean {
    const ready = this.context !== null;
    console.log("🔍 LLM: Vérification de l'état - Contexte existe:", ready);
    return ready;
  }

  async findExistingModel(fileName: string): Promise<string | null> {
    try {
      const possiblePaths = [
        `${FS.DocumentDirectoryPath}/${fileName}`,
        `${FS.DocumentDirectoryPath}/models/${fileName}`,
        // Ajouter d'autres chemins possibles si nécessaire
      ];
      
      for (const path of possiblePaths) {
        const exists = await FS.exists(path);
        if (exists) {
          console.log('✅ LLM: Modèle existant trouvé:', path);
          return path;
        }
      }
      
      // Chercher dans tous les fichiers du répertoire Documents
      const files = await FS.readDir(FS.DocumentDirectoryPath);
      for (const file of files) {
        if (file.name === fileName && file.isFile()) {
          const fullPath = `${FS.DocumentDirectoryPath}/${file.name}`;
          console.log('✅ LLM: Modèle existant trouvé dans le répertoire:', fullPath);
          return fullPath;
        }
      }
      
      console.log('⚠️ LLM: Aucun modèle existant trouvé pour:', fileName);
      return null;
    } catch (error) {
      console.error('❌ LLM: Erreur lors de la recherche de modèle existant:', error);
      return null;
    }
  }

  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      return await FS.exists(filePath);
    } catch (error) {
      console.error('❌ LLM: Erreur lors de la vérification du fichier:', error);
      return false;
    }
  }

  async cleanupOldModels(keepPath?: string): Promise<void> {
    try {
      const files = await FS.readDir(FS.DocumentDirectoryPath);
      const modelFiles = files.filter(file => 
        file.isFile() && 
        (file.name.endsWith('.gguf') || file.name.endsWith('.bin')) &&
        (!keepPath || `${FS.DocumentDirectoryPath}/${file.name}` !== keepPath)
      );
      
      for (const file of modelFiles) {
        const fullPath = `${FS.DocumentDirectoryPath}/${file.name}`;
        await FS.unlink(fullPath);
        console.log('🗑️ LLM: Ancien modèle supprimé:', file.name);
      }
    } catch (error) {
      console.error('❌ LLM: Erreur lors du nettoyage:', error);
    }
  }
}

export default new LlamaService();
