# MySeizures

MySeizures é um protótipo acadêmico mobile para acompanhamento remoto e manejo clínico de adultos
com epilepsia. O projeto prioriza funcionamento offline, acessibilidade, separação de camadas e
proteção de dados clínicos.

> Este projeto é um protótipo de TCC. Alertas são apenas indicadores informativos e não substituem
> avaliação profissional ou atendimento de emergência. Não use dados clínicos reais no ambiente de
> desenvolvimento.

## Workspaces

| Workspace | Diretório | Finalidade |
| --- | --- | --- |
| Mobile | `mobile/` | Aplicativo React Native com Expo e Expo Router; futuramente armazenará os dados clínicos localmente. |
| API | `api/` | Serviço REST JavaScript simulado para autenticação e concessões de acesso. Não armazena o histórico clínico. |

O repositório usa npm workspaces, portanto instalação e comandos compartilhados são executados a
partir da raiz.

## Pré-requisitos

- Node.js `>=20.19.0` e npm.
- Ambiente Expo com emulador Android, simulador iOS ou dispositivo compatível.
- Para iOS, um ambiente macOS com as ferramentas nativas necessárias.

## Configuração local

1. Instale as dependências:

   ```powershell
   npm install
   ```

2. Crie o arquivo de configuração local:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Ajuste `EXPO_PUBLIC_API_BASE_URL` para um endereço acessível pelo emulador/dispositivo e substitua
   `API_TOKEN_SECRET` por um valor local longo. O arquivo `.env` é ignorado pelo Git e nunca deve
   conter credenciais de produção.

## Execução

Inicie o aplicativo mobile:

```powershell
npm start
```

Atalhos específicos do workspace mobile:

```powershell
npm run android --workspace @myseizures/mobile
npm run ios --workspace @myseizures/mobile
```

O comando abaixo está reservado para a API e ficará operacional quando o servidor for implementado
na tarefa T012:

```powershell
npm run dev:api
```

No estado atual, o aplicativo abre uma rota de autenticação provisória; fluxos clínicos ainda não
foram implementados.

## Qualidade

```powershell
npm run lint
npm run format:check
npm test
```

Para formatar os arquivos JavaScript e JSON suportados:

```powershell
npm run format
```

## Escopo do protótipo

O MVP prevê registros de crises e gatilhos, tratamentos e aderência, lembretes locais, relatórios,
alertas informativos, compartilhamento controlado e exportação JSON. Sincronização em nuvem,
biometria, integração direta com RNDS/e-SUS ou prontuários, smartwatch e desktop não fazem parte do
protótipo.

## Documentação do desenvolvimento

- [Constitution](.specify/memory/constitution.md)
- [Specification](specs/001-manage-epilepsy-care/spec.md)
- [Implementation plan](specs/001-manage-epilepsy-care/plan.md)
- [Tasks](specs/001-manage-epilepsy-care/tasks.md)
- [Quickstart de validação](specs/001-manage-epilepsy-care/quickstart.md)
