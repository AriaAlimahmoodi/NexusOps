/**
 * MiniMax Node - Version 1
 * Discriminator: resource=audio, operation=textToSpeech
 */


interface Credentials {
  minimaxApi: CredentialReference;
}

/** Generate speech audio from text input */
export type LcMinimaxV1AudioTextToSpeechParams = {
  resource: 'audio';
  operation: 'textToSpeech';
/**
 * The speech synthesis model to use
 * @default speech-2.8-hd
 */
    modelId?: 'speech-02-hd' | 'speech-02-turbo' | 'speech-2.6-hd' | 'speech-2.6-turbo' | 'speech-2.8-hd' | 'speech-2.8-turbo' | Expression<string>;
/**
 * The text to convert to speech (max 10,000 characters)
 */
    text: string | Expression<string>;
/**
 * Voice ID to use for speech synthesis. Browse available voices in the &lt;a href="https://platform.minimax.io/docs/faq/system-voice-id"&gt;MiniMax documentation&lt;/a&gt;.
 * @default English_Graceful_Lady
 */
    voiceId?: string | Expression<string>;
/**
 * Whether to download the generated audio as binary data. When disabled, only the audio URL is returned.
 * @default true
 */
    downloadAudio?: boolean | Expression<boolean>;
/**
 * Options
 * @default {}
 */
    options?: {
    /** Output audio format. WAV is only supported in non-streaming mode.
     * @default mp3
     */
    audioFormat?: 'mp3' | 'pcm' | 'flac' | 'wav' | Expression<string>;
    /** Emotion for synthesized speech. By default the model auto-selects the most natural emotion.
     * @default calm
     */
    emotion?: 'angry' | 'calm' | 'disgusted' | 'fearful' | 'happy' | 'sad' | 'surprised' | Expression<string>;
    /** Enhance recognition for a specific language
     * @default auto
     */
    languageBoost?: 'Arabic' | 'auto' | 'Chinese' | 'English' | 'French' | 'German' | 'Indonesian' | 'Italian' | 'Japanese' | 'Korean' | 'Portuguese' | 'Russian' | 'Spanish' | 'Thai' | 'Turkish' | 'Vietnamese' | Expression<string>;
    /** Speech pitch adjustment (-12 to 12, 0 = original pitch)
     * @default 0
     */
    pitch?: number | Expression<number>;
    /** Speech speed (0.5-2, higher = faster)
     * @default 1
     */
    speed?: number | Expression<number>;
    /** Speech volume (0.1-10, higher = louder)
     * @default 1
     */
    volume?: number | Expression<number>;
  };
};

export interface LcMinimaxV1AudioTextToSpeechSubnodeConfig {
  tools?: ToolInstance[];
}

export type LcMinimaxV1AudioTextToSpeechNode = {
  type: '@n8n/n8n-nodes-langchain.minimax';
  version: 1;
  isTrigger: true;
  config: NodeConfig<LcMinimaxV1AudioTextToSpeechParams> & { credentials?: Credentials } & { subnodes?: LcMinimaxV1AudioTextToSpeechSubnodeConfig };
};