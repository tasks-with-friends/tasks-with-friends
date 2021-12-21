import { format } from 'prettier';

function githubActions() {
  const serverUrl = process.env.GITHUB_SERVER_URL;
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const sha = (process.env.GITHUB_SHA || '').substring(0, 7);

  return {
    build: `${serverUrl}/${repository}/actions/runs/${runId}`,
    commit: `${serverUrl}/${repository}/commit/${sha}`,
    repository: `${serverUrl}/${repository}`,
  };
}
function local() {
  return {
    local: true,
  };
}

let buildInfo: any = local();

if (process.env.GITHUB_SHA) {
  buildInfo = githubActions();
}

console.log(
  format(`export const buildInfo: any = ${JSON.stringify(buildInfo)};`, {
    parser: 'typescript',
  }),
);
