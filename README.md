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

2. Crie os arquivos de configuração locais da API e do aplicativo mobile:

   ```powershell
   Copy-Item .env.example .env
   Copy-Item mobile/.env.example mobile/.env
   ```

3. Em `mobile/.env`, ajuste `EXPO_PUBLIC_API_BASE_URL` para um endereço acessível pelo
   emulador/dispositivo. No `.env` da raiz, substitua `API_TOKEN_SECRET` por um valor local longo.
   Esses arquivos são ignorados pelo Git e nunca devem conter credenciais de produção. O segredo da
   API não deve ser copiado para `mobile/.env` nem receber o prefixo `EXPO_PUBLIC_`.

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

Para testar recursos nativos indisponíveis no Expo Go, como notificações push remotas no Android,
conecte o dispositivo físico por USB, habilite a depuração USB e, em uma máquina com Android SDK e
`adb` configurados, crie o development build:

```powershell
Set-Location mobile
npx expo run:android --device
```

Depois que o development build estiver instalado, use `npx expo start --lan` no mesmo diretório.
Sem o toolchain Android local, configure o projeto com `eas build:configure` e gere o APK de
desenvolvimento com `eas build --platform android --profile development`.

Inicie a API, que carrega `API_PORT` e `API_TOKEN_SECRET` do `.env` da raiz:

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
