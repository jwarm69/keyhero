// Audio file loader for WAV/MP3 files
// Loads and decodes audio files using Web Audio API

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type ProgressCallback = (progress: LoadProgress) => void;

export class AudioFileLoader {
  /**
   * Load and decode an audio file from a URL
   * @param url URL to the audio file (WAV or MP3)
   * @param audioContext AudioContext to use for decoding
   * @param onProgress Optional callback for loading progress
   * @returns Decoded AudioBuffer ready for playback
   */
  async loadAudioFile(
    url: string,
    audioContext: AudioContext,
    onProgress?: ProgressCallback
  ): Promise<AudioBuffer> {
    try {
      // Fetch the audio file
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load audio file: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      // Read the response as a stream if progress tracking is needed
      if (onProgress && response.body) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          loaded += value.length;
          
          onProgress({
            loaded,
            total,
            percentage: total > 0 ? (loaded / total) * 100 : 0
          });
        }

        // Combine chunks into single array buffer
        const arrayBuffer = new Uint8Array(loaded);
        let position = 0;
        for (const chunk of chunks) {
          arrayBuffer.set(chunk, position);
          position += chunk.length;
        }

        // Decode the audio data
        return await audioContext.decodeAudioData(arrayBuffer.buffer);
      } else {
        // Simple loading without progress tracking
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
      }
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw new Error(`Failed to load and decode audio file: ${error}`);
    }
  }

  /**
   * Preload multiple audio files
   * @param urls Array of URLs to load
   * @param audioContext AudioContext to use for decoding
   * @param onProgress Optional callback for overall progress
   * @returns Array of decoded AudioBuffers in the same order as URLs
   */
  async preloadAudioFiles(
    urls: string[],
    audioContext: AudioContext,
    onProgress?: ProgressCallback
  ): Promise<AudioBuffer[]> {
    const totalFiles = urls.length;
    let completedFiles = 0;

    const buffers: AudioBuffer[] = [];

    for (const url of urls) {
      const buffer = await this.loadAudioFile(url, audioContext, (fileProgress) => {
        if (onProgress) {
          // Calculate overall progress across all files
          const fileWeight = 100 / totalFiles;
          const overallPercentage = 
            (completedFiles * fileWeight) + 
            (fileProgress.percentage / totalFiles);

          onProgress({
            loaded: completedFiles,
            total: totalFiles,
            percentage: overallPercentage
          });
        }
      });

      buffers.push(buffer);
      completedFiles++;

      if (onProgress) {
        onProgress({
          loaded: completedFiles,
          total: totalFiles,
          percentage: (completedFiles / totalFiles) * 100
        });
      }
    }

    return buffers;
  }

  /**
   * Check if a URL points to a supported audio format
   * @param url URL to check
   * @returns true if the format is supported
   */
  isSupportedFormat(url: string): boolean {
    const supportedFormats = ['.wav', '.mp3', '.ogg', '.m4a'];
    const lowercaseUrl = url.toLowerCase();
    return supportedFormats.some(format => lowercaseUrl.endsWith(format));
  }

  /**
   * Get audio file format from URL
   * @param url URL to analyze
   * @returns File format (e.g., 'wav', 'mp3') or null if unknown
   */
  getAudioFormat(url: string): string | null {
    const match = url.match(/\.([a-z0-9]+)(\?|$)/i);
    return match ? match[1].toLowerCase() : null;
  }
}

// Singleton instance for convenience
export const audioLoader = new AudioFileLoader();


