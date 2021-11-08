declare module 'download-git-repo' {
  export default function download(
    repoPath: string,
    localPath: string,
    callback?: (e: Error) => void
  ): void;
}

declare module 'css-minimizer-webpack-plugin' {
  import { WebpackPluginInstance } from 'webpack';

  interface CssMinimizerPlugin {
    new (...args: any[]): WebpackPluginInstance;
  }
  declare class CssMinimizerPlugin implements CssMinimizerPlugin {}
  export default CssMinimizerPlugin;
}
