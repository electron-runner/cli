import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Compiler } from 'webpack';
import { Issue } from 'fork-ts-checker-webpack-plugin/lib/issue';

export class TsCheckerWebpackPlugin {
  apply(compiler: Compiler) {
    new ForkTsCheckerWebpackPlugin().apply(compiler);
    const hooks = ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler);
    // log some message on waiting
    hooks.waiting.tap('TsCheckerWebpackPlugin', () => {
      console.log('waiting for issues');
    });
    // don't show warnings
    hooks.issues.tap('TsCheckerWebpackPlugin', (issues: Issue[]) =>
      issues.filter((issue: Issue) => issue.severity === 'error')
    );
  }
}
