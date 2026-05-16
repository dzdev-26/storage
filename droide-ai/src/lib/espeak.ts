import ESpeakNg from 'espeak-ng';

// Cache for espeak instances or audio buffers if needed
class ESpeakTTS {
  private static instance = null;

  static async generateWav(text: string, lang: string = 'bn'): Promise<Uint8Array | null> {
    try {
      // Choose voice variant: +f1 for female 1
      const voice = `${lang}+f3`; // female variant 3
      const espeak = await ESpeakNg({
        arguments: [
          "-v", voice,
          "-w", "out.wav",
          "-s", "140", // speed
          "-p", "60", // pitch
          text
        ]
      });
      
      const wavData = espeak.FS.readFile("out.wav", { encoding: "binary" });
      return wavData as Uint8Array;
    } catch (err) {
      console.error("ESpeakNg error:", err);
      return null;
    }
  }
}

export default ESpeakTTS;
