import type { LanguageModel } from "ai";

import { getAnthropic } from "./factories/anthropic";
import { getCohere } from "./factories/cohere";
import { getDeepInfra } from "./factories/deepinfra";
import { getDeepSeek } from "./factories/deepseek";
import { getFireworks } from "./factories/fireworks";
import { getGoogle } from "./factories/google";
import { getGroq } from "./factories/groq";
import { getMistral } from "./factories/mistral";
import { getOpenAI } from "./factories/openai";
import { createOpenAICompatibleFactory } from "./factories/openai-compatible";
import { getOpenRouter } from "./factories/openrouter";
import { getPerplexity } from "./factories/perplexity";
import { getTogetherAI } from "./factories/togetherai";
import { getVercel } from "./factories/vercel";
import { getXai } from "./factories/xai";

const getAgentOne = createOpenAICompatibleFactory(
  "agent-one",
  "https://www.agent-one.dev/api/openai-compat/v1",
  undefined,
  {
    emptyApiKey: "not-authenticated",
  },
);
const get302AI = createOpenAICompatibleFactory("302ai", "https://api.302.ai/v1");
const getAbacus = createOpenAICompatibleFactory("abacus", "https://routellm.abacus.ai/v1");
const getAbliterationAI = createOpenAICompatibleFactory(
  "abliteration-ai",
  "https://api.abliteration.ai/v1",
);
const getAbove = createOpenAICompatibleFactory("above", "https://api.above.dev/v1");
const getAgentrouter = createOpenAICompatibleFactory("agentrouter", "https://agentrouter.org/v1");
const getAgnes = createOpenAICompatibleFactory("agnes", "https://apihub.agnes-ai.com/v1");
const getAiand = createOpenAICompatibleFactory("aiand", "https://api.aiand.com/v1");
const getAigateway = createOpenAICompatibleFactory("aigateway", "https://api.aigateway.sh/v1");
const getAihubmix = createOpenAICompatibleFactory("aihubmix", "https://aihubmix.com/v1");
const getAion = createOpenAICompatibleFactory("aion", "https://api.aionlabs.ai/v1");
const getAlibabaCn = createOpenAICompatibleFactory(
  "alibaba-cn",
  "https://dashscope.aliyuncs.com/compatible-mode/v1",
);
const getAmbient = createOpenAICompatibleFactory("ambient", "https://api.ambient.xyz/v1");
const getAntLing = createOpenAICompatibleFactory("ant-ling", "https://api.ant-ling.com/v1");
const getAnyapi = createOpenAICompatibleFactory("anyapi", "https://api.anyapi.ai/v1");
const getApiAirforce = createOpenAICompatibleFactory("api-airforce", "https://api.airforce/v1");
const getAvian = createOpenAICompatibleFactory("avian", "https://api.avian.io/v1/");
const getBaseten = createOpenAICompatibleFactory("baseten", "https://inference.baseten.co/v1");
const getBazaarlink = createOpenAICompatibleFactory("bazaarlink", "https://api.bazaarlink.ai/v1");
const getBerget = createOpenAICompatibleFactory("berget", "https://api.berget.ai/v1");
const getBigmodel = createOpenAICompatibleFactory(
  "bigmodel",
  "https://open.bigmodel.cn/api/paas/v4",
);
const getBothub = createOpenAICompatibleFactory("bothub", "https://openai.bothub.ru/v1");
const getCerebras = createOpenAICompatibleFactory("cerebras", "https://api.cerebras.ai/v1", {
  "X-Cerebras-3rd-Party-Integration": "Vercel AI SDK",
});
const getChutes = createOpenAICompatibleFactory("chutes", "https://llm.chutes.ai/v1");
const getCline = createOpenAICompatibleFactory("cline", "https://api.cline.bot/api/v1");
const getCortecs = createOpenAICompatibleFactory("cortecs", "https://api.cortecs.ai/v1");
const getCrof = createOpenAICompatibleFactory("crof", "https://crof.ai/v1");
const getCrossmodel = createOpenAICompatibleFactory("crossmodel", "https://api.crossmodel.ai/v1");
const getDaoxe = createOpenAICompatibleFactory("daoxe", "https://daoxe.com/v1");
const getEdenai = createOpenAICompatibleFactory("edenai", "https://api.edenai.run/v3");
const getElectronhub = createOpenAICompatibleFactory(
  "electronhub",
  "https://api.electronhub.ai/v1",
);
const getEmpiriolabs = createOpenAICompatibleFactory(
  "empiriolabs",
  "https://api.empiriolabs.ai/v1",
);
const getEngy = createOpenAICompatibleFactory("engy", "https://api.engy.ai/v1");
const getFastino = createOpenAICompatibleFactory("fastino", "https://api.fastino.ai/v1");
const getFastRouter = createOpenAICompatibleFactory(
  "fastrouter",
  "https://go.fastrouter.ai/api/v1",
);
const getFriendli = createOpenAICompatibleFactory(
  "friendli",
  "https://api.friendli.ai/serverless/v1",
);
const getGitHubCopilot = createOpenAICompatibleFactory(
  "github-copilot",
  "https://api.githubcopilot.com",
);
const getHelicone = createOpenAICompatibleFactory("helicone", "https://ai-gateway.helicone.ai/v1");
const getHuggingFace = createOpenAICompatibleFactory(
  "huggingface",
  "https://router.huggingface.co/v1",
);
const getHyper = createOpenAICompatibleFactory("hyper", "https://hyper.charm.land/v1");
const getImpossibl = createOpenAICompatibleFactory("impossibl", "https://api.impossibl.com/v1");
const getInception = createOpenAICompatibleFactory("inception", "https://api.inceptionlabs.ai/v1");
const getInceptron = createOpenAICompatibleFactory("inceptron", "https://api.inceptron.io/v1");
const getInco = createOpenAICompatibleFactory("inco", "https://api.inco.ai/v1");
const getInference = createOpenAICompatibleFactory("inference", "https://api.inference.net/v1");
const getIoNet = createOpenAICompatibleFactory(
  "io-net",
  "https://api.intelligence.io.solutions/api/v1",
);
const getJiekou = createOpenAICompatibleFactory("jiekou", "https://api.jiekou.ai/openai");
const getKenari = createOpenAICompatibleFactory("kenari", "https://kenari.id/v1");
const getKilo = createOpenAICompatibleFactory("kilo", "https://api.kilo.ai/api/gateway");
const getKiosapi = createOpenAICompatibleFactory("kiosapi", "https://kiosapi.com/v1");
const getKosmik = createOpenAICompatibleFactory("kosmik", "https://api.koscompute.com/v1");
const getLiterouter = createOpenAICompatibleFactory("literouter", "https://api.literouter.com/v1");
const getLlmGateway = createOpenAICompatibleFactory("llmgateway", "https://api.llmgateway.io/v1");
const getLlmtech = createOpenAICompatibleFactory("llmtech", "https://api.llmtech.eu/v1");
const getLlmtr = createOpenAICompatibleFactory("llmtr", "https://llmtr.com/v1");
const getLowrouter = createOpenAICompatibleFactory("lowrouter", "https://api.lowrouter.ai/v1");
const getMeganova = createOpenAICompatibleFactory("meganova", "https://api.meganova.ai/v1");
const getMeta = createOpenAICompatibleFactory("meta", "https://api.meta.ai/v1");
const getMixlayer = createOpenAICompatibleFactory("mixlayer", "https://models.mixlayer.ai/v1");
const getMnn = createOpenAICompatibleFactory("mnn", "https://api.mnnai.ru/v1");
const getMoark = createOpenAICompatibleFactory("moark", "https://moark.com/v1");
const getModelis = createOpenAICompatibleFactory("modelis", "https://modelishub.com/v1");
const getModelScope = createOpenAICompatibleFactory(
  "modelscope",
  "https://api-inference.modelscope.cn/v1",
);
const getNaga = createOpenAICompatibleFactory("naga", "https://api.naga.ac/v1");
const getNanoGpt = createOpenAICompatibleFactory("nano-gpt", "https://nano-gpt.com/api/v1");
const getNararouter = createOpenAICompatibleFactory("nararouter", "https://router.bynara.id/v1");
const getNearAI = createOpenAICompatibleFactory("nearai", "https://cloud-api.near.ai/v1");
const getNebius = createOpenAICompatibleFactory("nebius", "https://api.tokenfactory.nebius.com/v1");
const getNeuralwatt = createOpenAICompatibleFactory("neuralwatt", "https://api.neuralwatt.com/v1");
const getNousPortal = createOpenAICompatibleFactory(
  "nous-portal",
  "https://inference-api.nousresearch.com/v1",
);
const getNovita = createOpenAICompatibleFactory("novita", "https://api.novita.ai/openai");
const getNvidia = createOpenAICompatibleFactory("nvidia", "https://integrate.api.nvidia.com/v1");
const getOfox = createOpenAICompatibleFactory("ofox", "https://api.ofox.ai/v1");
const getOllamaCloud = createOpenAICompatibleFactory("ollama-cloud", "https://ollama.com/v1");
const getOpencodeZen = createOpenAICompatibleFactory(
  "opencode-zen",
  "https://opencode.ai/zen/v1",
  undefined,
  {
    emptyApiKey: "public",
  },
);
const getOpper = createOpenAICompatibleFactory("opper", "https://api.opper.ai/v3/compat");
const getOrcaRouter = createOpenAICompatibleFactory("orcarouter", "https://api.orcarouter.ai/v1");
const getOvhcloud = createOpenAICompatibleFactory(
  "ovhcloud",
  "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
);
const getPoe = createOpenAICompatibleFactory("poe", "https://api.poe.com/v1");
const getPrime = createOpenAICompatibleFactory("prime", "https://api.pinference.ai/api/v1");
const getQihangAi = createOpenAICompatibleFactory("qihang-ai", "https://api.qhaigc.net/v1");
const getQiniu = createOpenAICompatibleFactory("qiniu", "https://api.qnaigc.com/v1");
const getQuiver = createOpenAICompatibleFactory("quiver", "https://api.quiver.ai/v1");
const getRequesty = createOpenAICompatibleFactory("requesty", "https://router.requesty.ai/v1");
const getRoutingRun = createOpenAICompatibleFactory("routing-run", "https://api.routing.run/v1");
const getSakana = createOpenAICompatibleFactory("sakana", "https://api.sakana.ai/v1");
const getSeaLion = createOpenAICompatibleFactory("sea-lion", "https://api.sea-lion.ai/v1");
const getSensenovaTokenPlan = createOpenAICompatibleFactory(
  "sensenova-token-plan",
  "https://token.sensenova.ai/v1",
);
const getSpeka = createOpenAICompatibleFactory("speka", "https://speka.me/v1");
const getStandardcompute = createOpenAICompatibleFactory(
  "standardcompute",
  "https://api.stdcmpt.com/v1",
);
const getSynthetic = createOpenAICompatibleFactory(
  "synthetic",
  "https://api.synthetic.new/openai/v1",
);
const getTetrate = createOpenAICompatibleFactory("tetrate", "https://api.router.tetrate.ai/v1/");
const getTheGridAi = createOpenAICompatibleFactory("the-grid-ai", "https://api.thegrid.ai/v1");
const getTinfoil = createOpenAICompatibleFactory("tinfoil", "https://inference.tinfoil.sh/v1");
const getTokenRouter = createOpenAICompatibleFactory(
  "tokenrouter",
  "https://api.tokenrouter.com/v1",
);
const getTrustedrouter = createOpenAICompatibleFactory(
  "trustedrouter",
  "https://api.trustedrouter.com/v1",
);
const getTyphoon = createOpenAICompatibleFactory("typhoon", "https://api.opentyphoon.ai/v1");
const getUmansAi = createOpenAICompatibleFactory("umans-ai", "https://api.code.umans.ai/v1");
const getUnorouter = createOpenAICompatibleFactory("unorouter", "https://api.unorouter.com/v1");
const getVancine = createOpenAICompatibleFactory("vancine", "https://vancine.com/v1");
const getVenice = createOpenAICompatibleFactory("venice", "https://api.venice.ai/api/v1");
const getVispark = createOpenAICompatibleFactory("vispark", "https://api.lab.vispark.in/v1");
const getVivgrid = createOpenAICompatibleFactory("vivgrid", "https://api.vivgrid.com/v1");
const getVoidAi = createOpenAICompatibleFactory("void-ai", "https://api.voidai.app/v1");
const getVultr = createOpenAICompatibleFactory("vultr", "https://api.vultrinference.com/v1");
const getWaferAI = createOpenAICompatibleFactory("wafer-ai", "https://pass.wafer.ai/v1");
const getWandb = createOpenAICompatibleFactory("wandb", "https://api.inference.wandb.ai/v1");
const getXiaomi = createOpenAICompatibleFactory("xiaomi", "https://api.xiaomimimo.com/v1");
const getXpersona = createOpenAICompatibleFactory("xpersona", "https://www.xpersona.co/v1");
const getZai = createOpenAICompatibleFactory("zai", "https://api.z.ai/api/paas/v4");
const getZenifra = createOpenAICompatibleFactory("zenifra", "https://ai.zenifra.com/v1");
const getZenmux = createOpenAICompatibleFactory("zenmux", "https://zenmux.ai/api/v1");
const getZylo = createOpenAICompatibleFactory("zylo", "https://api.zyloai.net/v1");

export type ProviderFactory = (
  apiKey: string,
  headers?: Record<string, string>,
) => { languageModel: (modelId: string) => LanguageModel };

export interface ProviderDefinition {
  id: string;
  label: string;
  storageKey: string;
  envKey: string;
  factory: ProviderFactory;
  priority: number;
}

export const PROVIDER_REGISTRY = [
  {
    id: "agent-one",
    label: "AgentOne",
    storageKey: "AGENT_ONE_API_KEY",
    envKey: "AGENT_ONE_API_KEY",
    factory: getAgentOne as ProviderFactory,
    priority: 0,
  },
  {
    id: "302ai",
    label: "302.AI",
    storageKey: "302AI_API_KEY",
    envKey: "AGENT_ONE_302AI_API_KEY",
    factory: get302AI as ProviderFactory,
    priority: 1,
  },
  {
    id: "abacus",
    label: "Abacus",
    storageKey: "ABACUS_API_KEY",
    envKey: "AGENT_ONE_ABACUS_API_KEY",
    factory: getAbacus as ProviderFactory,
    priority: 2,
  },
  {
    id: "abliteration-ai",
    label: "Abliteration.ai",
    storageKey: "ABLIT_KEY",
    envKey: "AGENT_ONE_ABLIT_KEY",
    factory: getAbliterationAI as ProviderFactory,
    priority: 3,
  },
  {
    id: "above",
    label: "Above",
    storageKey: "ABOVE_API_KEY",
    envKey: "AGENT_ONE_ABOVE_API_KEY",
    factory: getAbove as ProviderFactory,
    priority: 4,
  },
  {
    id: "agentrouter",
    label: "AgentRouter",
    storageKey: "AGENTROUTER_API_KEY",
    envKey: "AGENT_ONE_AGENTROUTER_API_KEY",
    factory: getAgentrouter as ProviderFactory,
    priority: 5,
  },
  {
    id: "agnes",
    label: "Agnes",
    storageKey: "AGNES_API_KEY",
    envKey: "AGENT_ONE_AGNES_API_KEY",
    factory: getAgnes as ProviderFactory,
    priority: 6,
  },
  {
    id: "aiand",
    label: "ai&",
    storageKey: "AIAND_API_KEY",
    envKey: "AGENT_ONE_AIAND_API_KEY",
    factory: getAiand as ProviderFactory,
    priority: 7,
  },
  {
    id: "aigateway",
    label: "AIgateway",
    storageKey: "AIGATEWAY_API_KEY",
    envKey: "AGENT_ONE_AIGATEWAY_API_KEY",
    factory: getAigateway as ProviderFactory,
    priority: 8,
  },
  {
    id: "aihubmix",
    label: "AIHubMix",
    storageKey: "AIHUBMIX_API_KEY",
    envKey: "AGENT_ONE_AIHUBMIX_API_KEY",
    factory: getAihubmix as ProviderFactory,
    priority: 9,
  },
  {
    id: "aion",
    label: "Aion",
    storageKey: "AION_API_KEY",
    envKey: "AGENT_ONE_AION_API_KEY",
    factory: getAion as ProviderFactory,
    priority: 10,
  },
  {
    id: "alibaba-cn",
    label: "Alibaba (China)",
    storageKey: "DASHSCOPE_API_KEY",
    envKey: "AGENT_ONE_DASHSCOPE_API_KEY",
    factory: getAlibabaCn as ProviderFactory,
    priority: 11,
  },
  {
    id: "ambient",
    label: "Ambient",
    storageKey: "AMBIENT_API_KEY",
    envKey: "AGENT_ONE_AMBIENT_API_KEY",
    factory: getAmbient as ProviderFactory,
    priority: 12,
  },
  {
    id: "ant-ling",
    label: "Ant Ling",
    storageKey: "ANT_LING_API_KEY",
    envKey: "AGENT_ONE_ANT_LING_API_KEY",
    factory: getAntLing as ProviderFactory,
    priority: 13,
  },
  {
    id: "anthropic",
    label: "Anthropic",
    storageKey: "ANTHROPIC_API_KEY",
    envKey: "AGENT_ONE_ANTHROPIC_API_KEY",
    factory: getAnthropic as ProviderFactory,
    priority: 14,
  },
  {
    id: "anyapi",
    label: "AnyAPI",
    storageKey: "ANYAPI_API_KEY",
    envKey: "AGENT_ONE_ANYAPI_API_KEY",
    factory: getAnyapi as ProviderFactory,
    priority: 15,
  },
  {
    id: "api-airforce",
    label: "Api.Airforce",
    storageKey: "API_AIRFORCE_API_KEY",
    envKey: "AGENT_ONE_API_AIRFORCE_API_KEY",
    factory: getApiAirforce as ProviderFactory,
    priority: 16,
  },
  {
    id: "avian",
    label: "avian",
    storageKey: "AVIAN_API_KEY",
    envKey: "AGENT_ONE_AVIAN_API_KEY",
    factory: getAvian as ProviderFactory,
    priority: 17,
  },
  {
    id: "baseten",
    label: "Baseten",
    storageKey: "BASETEN_API_KEY",
    envKey: "AGENT_ONE_BASETEN_API_KEY",
    factory: getBaseten as ProviderFactory,
    priority: 18,
  },
  {
    id: "bazaarlink",
    label: "BazaarLink",
    storageKey: "BAZAARLINK_API_KEY",
    envKey: "AGENT_ONE_BAZAARLINK_API_KEY",
    factory: getBazaarlink as ProviderFactory,
    priority: 19,
  },
  {
    id: "berget",
    label: "Berget.AI",
    storageKey: "BERGET_API_KEY",
    envKey: "AGENT_ONE_BERGET_API_KEY",
    factory: getBerget as ProviderFactory,
    priority: 20,
  },
  {
    id: "bigmodel",
    label: "BigModel",
    storageKey: "ZHIPU_API_KEY",
    envKey: "AGENT_ONE_ZHIPU_API_KEY",
    factory: getBigmodel as ProviderFactory,
    priority: 21,
  },
  {
    id: "bothub",
    label: "BotHub",
    storageKey: "BOTHUB_API_KEY",
    envKey: "AGENT_ONE_BOTHUB_API_KEY",
    factory: getBothub as ProviderFactory,
    priority: 22,
  },
  {
    id: "cerebras",
    label: "Cerebras",
    storageKey: "CEREBRAS_API_KEY",
    envKey: "AGENT_ONE_CEREBRAS_API_KEY",
    factory: getCerebras as ProviderFactory,
    priority: 23,
  },
  {
    id: "chutes",
    label: "Chutes",
    storageKey: "CHUTES_API_KEY",
    envKey: "AGENT_ONE_CHUTES_API_KEY",
    factory: getChutes as ProviderFactory,
    priority: 24,
  },
  {
    id: "cline",
    label: "Cline",
    storageKey: "CLINE_API_KEY",
    envKey: "AGENT_ONE_CLINE_API_KEY",
    factory: getCline as ProviderFactory,
    priority: 25,
  },
  {
    id: "cohere",
    label: "Cohere",
    storageKey: "COHERE_API_KEY",
    envKey: "AGENT_ONE_COHERE_API_KEY",
    factory: getCohere as ProviderFactory,
    priority: 26,
  },
  {
    id: "cortecs",
    label: "Cortecs",
    storageKey: "CORTECS_API_KEY",
    envKey: "AGENT_ONE_CORTECS_API_KEY",
    factory: getCortecs as ProviderFactory,
    priority: 27,
  },
  {
    id: "crof",
    label: "CrofAI",
    storageKey: "CROF_API_KEY",
    envKey: "AGENT_ONE_CROF_API_KEY",
    factory: getCrof as ProviderFactory,
    priority: 28,
  },
  {
    id: "crossmodel",
    label: "CrossModel",
    storageKey: "CROSSMODEL_API_KEY",
    envKey: "AGENT_ONE_CROSSMODEL_API_KEY",
    factory: getCrossmodel as ProviderFactory,
    priority: 29,
  },
  {
    id: "daoxe",
    label: "DaoXE",
    storageKey: "DAOXE_API_KEY",
    envKey: "AGENT_ONE_DAOXE_API_KEY",
    factory: getDaoxe as ProviderFactory,
    priority: 30,
  },
  {
    id: "deepinfra",
    label: "DeepInfra",
    storageKey: "DEEPINFRA_API_KEY",
    envKey: "AGENT_ONE_DEEPINFRA_API_KEY",
    factory: getDeepInfra as ProviderFactory,
    priority: 31,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    storageKey: "DEEPSEEK_API_KEY",
    envKey: "AGENT_ONE_DEEPSEEK_API_KEY",
    factory: getDeepSeek as ProviderFactory,
    priority: 32,
  },
  {
    id: "edenai",
    label: "Eden AI",
    storageKey: "EDENAI_API_KEY",
    envKey: "AGENT_ONE_EDENAI_API_KEY",
    factory: getEdenai as ProviderFactory,
    priority: 33,
  },
  {
    id: "electronhub",
    label: "ElectronHub",
    storageKey: "ELECTRONHUB_API_KEY",
    envKey: "AGENT_ONE_ELECTRONHUB_API_KEY",
    factory: getElectronhub as ProviderFactory,
    priority: 34,
  },
  {
    id: "empiriolabs",
    label: "EmpirioLabs AI",
    storageKey: "EMPIRIOLABS_API_KEY",
    envKey: "AGENT_ONE_EMPIRIOLABS_API_KEY",
    factory: getEmpiriolabs as ProviderFactory,
    priority: 35,
  },
  {
    id: "engy",
    label: "Engy",
    storageKey: "ENGY_API_KEY",
    envKey: "AGENT_ONE_ENGY_API_KEY",
    factory: getEngy as ProviderFactory,
    priority: 36,
  },
  {
    id: "fastino",
    label: "Fastino",
    storageKey: "FASTINO_API_KEY",
    envKey: "AGENT_ONE_FASTINO_API_KEY",
    factory: getFastino as ProviderFactory,
    priority: 37,
  },
  {
    id: "fastrouter",
    label: "FastRouter",
    storageKey: "FASTROUTER_API_KEY",
    envKey: "AGENT_ONE_FASTROUTER_API_KEY",
    factory: getFastRouter as ProviderFactory,
    priority: 38,
  },
  {
    id: "fireworks-ai",
    label: "Fireworks AI",
    storageKey: "FIREWORKS_API_KEY",
    envKey: "AGENT_ONE_FIREWORKS_API_KEY",
    factory: getFireworks as ProviderFactory,
    priority: 39,
  },
  {
    id: "friendli",
    label: "Friendli",
    storageKey: "FRIENDLI_TOKEN",
    envKey: "AGENT_ONE_FRIENDLI_TOKEN",
    factory: getFriendli as ProviderFactory,
    priority: 40,
  },
  {
    id: "github-copilot",
    label: "GitHub Copilot",
    storageKey: "GITHUB_TOKEN",
    envKey: "AGENT_ONE_GITHUB_TOKEN",
    factory: getGitHubCopilot as ProviderFactory,
    priority: 41,
  },
  {
    id: "google",
    label: "Google Generative AI",
    storageKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    envKey: "AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY",
    factory: getGoogle as ProviderFactory,
    priority: 42,
  },
  {
    id: "groq",
    label: "Groq",
    storageKey: "GROQ_API_KEY",
    envKey: "AGENT_ONE_GROQ_API_KEY",
    factory: getGroq as ProviderFactory,
    priority: 43,
  },
  {
    id: "helicone",
    label: "Helicone",
    storageKey: "HELICONE_API_KEY",
    envKey: "AGENT_ONE_HELICONE_API_KEY",
    factory: getHelicone as ProviderFactory,
    priority: 44,
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    storageKey: "HF_TOKEN",
    envKey: "AGENT_ONE_HF_TOKEN",
    factory: getHuggingFace as ProviderFactory,
    priority: 45,
  },
  {
    id: "hyper",
    label: "Hyper by Charm",
    storageKey: "HYPER_API_KEY",
    envKey: "AGENT_ONE_HYPER_API_KEY",
    factory: getHyper as ProviderFactory,
    priority: 46,
  },
  {
    id: "impossibl",
    label: "Impossibl",
    storageKey: "IMPOSSIBL_API_KEY",
    envKey: "AGENT_ONE_IMPOSSIBL_API_KEY",
    factory: getImpossibl as ProviderFactory,
    priority: 47,
  },
  {
    id: "inception",
    label: "Inception",
    storageKey: "INCEPTION_API_KEY",
    envKey: "AGENT_ONE_INCEPTION_API_KEY",
    factory: getInception as ProviderFactory,
    priority: 48,
  },
  {
    id: "inceptron",
    label: "Inceptron",
    storageKey: "INCEPTRON_API_KEY",
    envKey: "AGENT_ONE_INCEPTRON_API_KEY",
    factory: getInceptron as ProviderFactory,
    priority: 49,
  },
  {
    id: "inco",
    label: "Inco",
    storageKey: "INCO_API_KEY",
    envKey: "AGENT_ONE_INCO_API_KEY",
    factory: getInco as ProviderFactory,
    priority: 50,
  },
  {
    id: "inference",
    label: "Inference.net",
    storageKey: "INFERENCE_API_KEY",
    envKey: "AGENT_ONE_INFERENCE_API_KEY",
    factory: getInference as ProviderFactory,
    priority: 51,
  },
  {
    id: "io-net",
    label: "IO.NET",
    storageKey: "IOINTELLIGENCE_API_KEY",
    envKey: "AGENT_ONE_IOINTELLIGENCE_API_KEY",
    factory: getIoNet as ProviderFactory,
    priority: 52,
  },
  {
    id: "jiekou",
    label: "Jiekou.AI",
    storageKey: "JIEKOU_API_KEY",
    envKey: "AGENT_ONE_JIEKOU_API_KEY",
    factory: getJiekou as ProviderFactory,
    priority: 53,
  },
  {
    id: "kenari",
    label: "Kenari",
    storageKey: "KENARI_API_KEY",
    envKey: "AGENT_ONE_KENARI_API_KEY",
    factory: getKenari as ProviderFactory,
    priority: 54,
  },
  {
    id: "kilo",
    label: "Kilo Gateway",
    storageKey: "KILO_API_KEY",
    envKey: "AGENT_ONE_KILO_API_KEY",
    factory: getKilo as ProviderFactory,
    priority: 55,
  },
  {
    id: "kiosapi",
    label: "KiosAPI",
    storageKey: "KIOSAPI_API_KEY",
    envKey: "AGENT_ONE_KIOSAPI_API_KEY",
    factory: getKiosapi as ProviderFactory,
    priority: 56,
  },
  {
    id: "kosmik",
    label: "Kosmik Compute",
    storageKey: "KOSMIK_API_KEY",
    envKey: "AGENT_ONE_KOSMIK_API_KEY",
    factory: getKosmik as ProviderFactory,
    priority: 57,
  },
  {
    id: "literouter",
    label: "LiteRouter",
    storageKey: "LITEROUTER_API_KEY",
    envKey: "AGENT_ONE_LITEROUTER_API_KEY",
    factory: getLiterouter as ProviderFactory,
    priority: 58,
  },
  {
    id: "llmgateway",
    label: "LLM Gateway",
    storageKey: "LLMGATEWAY_API_KEY",
    envKey: "AGENT_ONE_LLMGATEWAY_API_KEY",
    factory: getLlmGateway as ProviderFactory,
    priority: 59,
  },
  {
    id: "llmtech",
    label: "LLM Tech",
    storageKey: "LLMTECH_API_KEY",
    envKey: "AGENT_ONE_LLMTECH_API_KEY",
    factory: getLlmtech as ProviderFactory,
    priority: 60,
  },
  {
    id: "llmtr",
    label: "LLMTR",
    storageKey: "LLMTR_API_KEY",
    envKey: "AGENT_ONE_LLMTR_API_KEY",
    factory: getLlmtr as ProviderFactory,
    priority: 61,
  },
  {
    id: "lowrouter",
    label: "LowRouter",
    storageKey: "LOWROUTER_API_KEY",
    envKey: "AGENT_ONE_LOWROUTER_API_KEY",
    factory: getLowrouter as ProviderFactory,
    priority: 62,
  },
  {
    id: "meganova",
    label: "MegaNova",
    storageKey: "MEGANOVA_API_KEY",
    envKey: "AGENT_ONE_MEGANOVA_API_KEY",
    factory: getMeganova as ProviderFactory,
    priority: 63,
  },
  {
    id: "meta",
    label: "Meta",
    storageKey: "MUSE_API_KEY",
    envKey: "AGENT_ONE_MUSE_API_KEY",
    factory: getMeta as ProviderFactory,
    priority: 64,
  },
  {
    id: "mistral",
    label: "Mistral",
    storageKey: "MISTRAL_API_KEY",
    envKey: "AGENT_ONE_MISTRAL_API_KEY",
    factory: getMistral as ProviderFactory,
    priority: 65,
  },
  {
    id: "mixlayer",
    label: "Mixlayer",
    storageKey: "MIXLAYER_API_KEY",
    envKey: "AGENT_ONE_MIXLAYER_API_KEY",
    factory: getMixlayer as ProviderFactory,
    priority: 66,
  },
  {
    id: "mnn",
    label: "MNN",
    storageKey: "MNN_API_KEY",
    envKey: "AGENT_ONE_MNN_API_KEY",
    factory: getMnn as ProviderFactory,
    priority: 67,
  },
  {
    id: "moark",
    label: "Moark",
    storageKey: "MOARK_API_KEY",
    envKey: "AGENT_ONE_MOARK_API_KEY",
    factory: getMoark as ProviderFactory,
    priority: 68,
  },
  {
    id: "modelis",
    label: "Modelis",
    storageKey: "MODELIS_API_KEY",
    envKey: "AGENT_ONE_MODELIS_API_KEY",
    factory: getModelis as ProviderFactory,
    priority: 69,
  },
  {
    id: "modelscope",
    label: "ModelScope",
    storageKey: "MODELSCOPE_API_KEY",
    envKey: "AGENT_ONE_MODELSCOPE_API_KEY",
    factory: getModelScope as ProviderFactory,
    priority: 70,
  },
  {
    id: "naga",
    label: "Naga",
    storageKey: "NAGA_API_KEY",
    envKey: "AGENT_ONE_NAGA_API_KEY",
    factory: getNaga as ProviderFactory,
    priority: 71,
  },
  {
    id: "nano-gpt",
    label: "NanoGPT",
    storageKey: "NANO_GPT_API_KEY",
    envKey: "AGENT_ONE_NANO_GPT_API_KEY",
    factory: getNanoGpt as ProviderFactory,
    priority: 72,
  },
  {
    id: "nararouter",
    label: "NaraRouter",
    storageKey: "NARAROUTER_API_KEY",
    envKey: "AGENT_ONE_NARAROUTER_API_KEY",
    factory: getNararouter as ProviderFactory,
    priority: 73,
  },
  {
    id: "nearai",
    label: "NEAR AI Cloud",
    storageKey: "NEARAI_API_KEY",
    envKey: "AGENT_ONE_NEARAI_API_KEY",
    factory: getNearAI as ProviderFactory,
    priority: 74,
  },
  {
    id: "nebius",
    label: "Nebius Token Factory",
    storageKey: "NEBIUS_API_KEY",
    envKey: "AGENT_ONE_NEBIUS_API_KEY",
    factory: getNebius as ProviderFactory,
    priority: 75,
  },
  {
    id: "neuralwatt",
    label: "Neuralwatt",
    storageKey: "NEURALWATT_API_KEY",
    envKey: "AGENT_ONE_NEURALWATT_API_KEY",
    factory: getNeuralwatt as ProviderFactory,
    priority: 76,
  },
  {
    id: "nous-portal",
    label: "Nous Portal",
    storageKey: "NOUS_PORTAL_API_KEY",
    envKey: "AGENT_ONE_NOUS_PORTAL_API_KEY",
    factory: getNousPortal as ProviderFactory,
    priority: 77,
  },
  {
    id: "novita",
    label: "Novita",
    storageKey: "NOVITA_API_KEY",
    envKey: "AGENT_ONE_NOVITA_API_KEY",
    factory: getNovita as ProviderFactory,
    priority: 78,
  },
  {
    id: "nvidia",
    label: "Nvidia",
    storageKey: "NVIDIA_API_KEY",
    envKey: "AGENT_ONE_NVIDIA_API_KEY",
    factory: getNvidia as ProviderFactory,
    priority: 79,
  },
  {
    id: "ofox",
    label: "Ofox",
    storageKey: "OFOX_API_KEY",
    envKey: "AGENT_ONE_OFOX_API_KEY",
    factory: getOfox as ProviderFactory,
    priority: 80,
  },
  {
    id: "ollama-cloud",
    label: "Ollama Cloud",
    storageKey: "OLLAMA_CLOUD_API_KEY",
    envKey: "AGENT_ONE_OLLAMA_CLOUD_API_KEY",
    factory: getOllamaCloud as ProviderFactory,
    priority: 81,
  },
  {
    id: "openai",
    label: "OpenAI",
    storageKey: "OPENAI_API_KEY",
    envKey: "AGENT_ONE_OPENAI_API_KEY",
    factory: getOpenAI as ProviderFactory,
    priority: 82,
  },
  {
    id: "opencode-zen",
    label: "OpenCode Zen",
    storageKey: "OPENCODE_ZEN_API_KEY",
    envKey: "AGENT_ONE_OPENCODE_ZEN_API_KEY",
    factory: getOpencodeZen as ProviderFactory,
    priority: 83,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    storageKey: "OPENROUTER_API_KEY",
    envKey: "AGENT_ONE_OPENROUTER_API_KEY",
    factory: getOpenRouter as ProviderFactory,
    priority: 84,
  },
  {
    id: "opper",
    label: "Opper",
    storageKey: "OPPER_API_KEY",
    envKey: "AGENT_ONE_OPPER_API_KEY",
    factory: getOpper as ProviderFactory,
    priority: 85,
  },
  {
    id: "orcarouter",
    label: "OrcaRouter",
    storageKey: "ORCAROUTER_API_KEY",
    envKey: "AGENT_ONE_ORCAROUTER_API_KEY",
    factory: getOrcaRouter as ProviderFactory,
    priority: 86,
  },
  {
    id: "ovhcloud",
    label: "OVHcloud AI Endpoints",
    storageKey: "OVHCLOUD_API_KEY",
    envKey: "AGENT_ONE_OVHCLOUD_API_KEY",
    factory: getOvhcloud as ProviderFactory,
    priority: 87,
  },
  {
    id: "perplexity",
    label: "Perplexity",
    storageKey: "PERPLEXITY_API_KEY",
    envKey: "AGENT_ONE_PERPLEXITY_API_KEY",
    factory: getPerplexity as ProviderFactory,
    priority: 88,
  },
  {
    id: "poe",
    label: "Poe",
    storageKey: "POE_API_KEY",
    envKey: "AGENT_ONE_POE_API_KEY",
    factory: getPoe as ProviderFactory,
    priority: 89,
  },
  {
    id: "prime",
    label: "Prime Intellect",
    storageKey: "PRIME_API_KEY",
    envKey: "AGENT_ONE_PRIME_API_KEY",
    factory: getPrime as ProviderFactory,
    priority: 90,
  },
  {
    id: "qihang-ai",
    label: "QiHang AI",
    storageKey: "QIHANG_API_KEY",
    envKey: "AGENT_ONE_QIHANG_API_KEY",
    factory: getQihangAi as ProviderFactory,
    priority: 91,
  },
  {
    id: "qiniu",
    label: "Qiniu",
    storageKey: "QINIU_API_KEY",
    envKey: "AGENT_ONE_QINIU_API_KEY",
    factory: getQiniu as ProviderFactory,
    priority: 92,
  },
  {
    id: "quiver",
    label: "Quiver",
    storageKey: "QUIVER_AI_API_KEY",
    envKey: "AGENT_ONE_QUIVER_AI_API_KEY",
    factory: getQuiver as ProviderFactory,
    priority: 93,
  },
  {
    id: "requesty",
    label: "Requesty",
    storageKey: "REQUESTY_API_KEY",
    envKey: "AGENT_ONE_REQUESTY_API_KEY",
    factory: getRequesty as ProviderFactory,
    priority: 94,
  },
  {
    id: "routing-run",
    label: "routing.run",
    storageKey: "ROUTING_RUN_API_KEY",
    envKey: "AGENT_ONE_ROUTING_RUN_API_KEY",
    factory: getRoutingRun as ProviderFactory,
    priority: 95,
  },
  {
    id: "sakana",
    label: "Sakana",
    storageKey: "SAKANA_API_KEY",
    envKey: "AGENT_ONE_SAKANA_API_KEY",
    factory: getSakana as ProviderFactory,
    priority: 96,
  },
  {
    id: "sea-lion",
    label: "SEA-LION",
    storageKey: "SEA_LION_API_KEY",
    envKey: "AGENT_ONE_SEA_LION_API_KEY",
    factory: getSeaLion as ProviderFactory,
    priority: 97,
  },
  {
    id: "sensenova-token-plan",
    label: "SenseNova Token Plan",
    storageKey: "SENSENOVA_API_KEY",
    envKey: "AGENT_ONE_SENSENOVA_API_KEY",
    factory: getSensenovaTokenPlan as ProviderFactory,
    priority: 98,
  },
  {
    id: "speka",
    label: "Speka",
    storageKey: "SPEKA_API_KEY",
    envKey: "AGENT_ONE_SPEKA_API_KEY",
    factory: getSpeka as ProviderFactory,
    priority: 99,
  },
  {
    id: "standardcompute",
    label: "Standard Compute",
    storageKey: "STANDARDCOMPUTE_API_KEY",
    envKey: "AGENT_ONE_STANDARDCOMPUTE_API_KEY",
    factory: getStandardcompute as ProviderFactory,
    priority: 100,
  },
  {
    id: "synthetic",
    label: "Synthetic",
    storageKey: "SYNTHETIC_API_KEY",
    envKey: "AGENT_ONE_SYNTHETIC_API_KEY",
    factory: getSynthetic as ProviderFactory,
    priority: 101,
  },
  {
    id: "tetrate",
    label: "Tetrate Agent Router Service",
    storageKey: "TARS_API_KEY",
    envKey: "AGENT_ONE_TARS_API_KEY",
    factory: getTetrate as ProviderFactory,
    priority: 102,
  },
  {
    id: "the-grid-ai",
    label: "The Grid",
    storageKey: "THEGRID_API_KEY",
    envKey: "AGENT_ONE_THEGRID_API_KEY",
    factory: getTheGridAi as ProviderFactory,
    priority: 103,
  },
  {
    id: "tinfoil",
    label: "Tinfoil",
    storageKey: "TINFOIL_API_KEY",
    envKey: "AGENT_ONE_TINFOIL_API_KEY",
    factory: getTinfoil as ProviderFactory,
    priority: 104,
  },
  {
    id: "togetherai",
    label: "Together AI",
    storageKey: "TOGETHERAI_API_KEY",
    envKey: "AGENT_ONE_TOGETHERAI_API_KEY",
    factory: getTogetherAI as ProviderFactory,
    priority: 105,
  },
  {
    id: "tokenrouter",
    label: "TokenRouter",
    storageKey: "TOKENROUTER_API_KEY",
    envKey: "AGENT_ONE_TOKENROUTER_API_KEY",
    factory: getTokenRouter as ProviderFactory,
    priority: 106,
  },
  {
    id: "trustedrouter",
    label: "TrustedRouter",
    storageKey: "TRUSTEDROUTER_API_KEY",
    envKey: "AGENT_ONE_TRUSTEDROUTER_API_KEY",
    factory: getTrustedrouter as ProviderFactory,
    priority: 107,
  },
  {
    id: "typhoon",
    label: "Typhoon",
    storageKey: "TYPHOON_API_KEY",
    envKey: "AGENT_ONE_TYPHOON_API_KEY",
    factory: getTyphoon as ProviderFactory,
    priority: 108,
  },
  {
    id: "umans-ai",
    label: "Umans AI",
    storageKey: "UMANS_AI_API_KEY",
    envKey: "AGENT_ONE_UMANS_AI_API_KEY",
    factory: getUmansAi as ProviderFactory,
    priority: 109,
  },
  {
    id: "unorouter",
    label: "UnoRouter",
    storageKey: "UNOROUTER_API_KEY",
    envKey: "AGENT_ONE_UNOROUTER_API_KEY",
    factory: getUnorouter as ProviderFactory,
    priority: 110,
  },
  {
    id: "vancine",
    label: "Vancine",
    storageKey: "VANCINE_API_KEY",
    envKey: "AGENT_ONE_VANCINE_API_KEY",
    factory: getVancine as ProviderFactory,
    priority: 111,
  },
  {
    id: "venice",
    label: "Venice AI",
    storageKey: "VENICE_API_KEY",
    envKey: "AGENT_ONE_VENICE_API_KEY",
    factory: getVenice as ProviderFactory,
    priority: 112,
  },
  {
    id: "vercel",
    label: "Vercel AI Gateway",
    storageKey: "AI_GATEWAY_API_KEY",
    envKey: "AGENT_ONE_AI_GATEWAY_API_KEY",
    factory: getVercel as ProviderFactory,
    priority: 113,
  },
  {
    id: "vispark",
    label: "Vispark",
    storageKey: "VISPARK_LAB_API_KEY",
    envKey: "AGENT_ONE_VISPARK_LAB_API_KEY",
    factory: getVispark as ProviderFactory,
    priority: 114,
  },
  {
    id: "vivgrid",
    label: "Vivgrid",
    storageKey: "VIVGRID_API_KEY",
    envKey: "AGENT_ONE_VIVGRID_API_KEY",
    factory: getVivgrid as ProviderFactory,
    priority: 115,
  },
  {
    id: "void-ai",
    label: "Void AI",
    storageKey: "VOID_API_KEY",
    envKey: "AGENT_ONE_VOID_API_KEY",
    factory: getVoidAi as ProviderFactory,
    priority: 116,
  },
  {
    id: "vultr",
    label: "Vultr Inference",
    storageKey: "VULTR_API_KEY",
    envKey: "AGENT_ONE_VULTR_API_KEY",
    factory: getVultr as ProviderFactory,
    priority: 117,
  },
  {
    id: "wafer-ai",
    label: "Wafer",
    storageKey: "WAFER_AI_API_KEY",
    envKey: "AGENT_ONE_WAFER_AI_API_KEY",
    factory: getWaferAI as ProviderFactory,
    priority: 118,
  },
  {
    id: "wandb",
    label: "Weights & Biases",
    storageKey: "WANDB_API_KEY",
    envKey: "AGENT_ONE_WANDB_API_KEY",
    factory: getWandb as ProviderFactory,
    priority: 119,
  },
  {
    id: "xai",
    label: "xAI",
    storageKey: "XAI_API_KEY",
    envKey: "AGENT_ONE_XAI_API_KEY",
    factory: getXai as ProviderFactory,
    priority: 120,
  },
  {
    id: "xiaomi",
    label: "Xiaomi MiMo",
    storageKey: "XIAOMI_API_KEY",
    envKey: "AGENT_ONE_XIAOMI_API_KEY",
    factory: getXiaomi as ProviderFactory,
    priority: 121,
  },
  {
    id: "xpersona",
    label: "Xpersona",
    storageKey: "XPERSONA_API_KEY",
    envKey: "AGENT_ONE_XPERSONA_API_KEY",
    factory: getXpersona as ProviderFactory,
    priority: 122,
  },
  {
    id: "zai",
    label: "Z.ai",
    storageKey: "ZAI_API_KEY",
    envKey: "AGENT_ONE_ZAI_API_KEY",
    factory: getZai as ProviderFactory,
    priority: 123,
  },
  {
    id: "zenifra",
    label: "Zenifra",
    storageKey: "ZENIFRA_AI_KEY",
    envKey: "AGENT_ONE_ZENIFRA_AI_KEY",
    factory: getZenifra as ProviderFactory,
    priority: 124,
  },
  {
    id: "zenmux",
    label: "ZenMux",
    storageKey: "ZENMUX_API_KEY",
    envKey: "AGENT_ONE_ZENMUX_API_KEY",
    factory: getZenmux as ProviderFactory,
    priority: 125,
  },
  {
    id: "zylo",
    label: "Zylo",
    storageKey: "ZYLO_API_KEY",
    envKey: "AGENT_ONE_ZYLO_API_KEY",
    factory: getZylo as ProviderFactory,
    priority: 126,
  },
] as const satisfies readonly ProviderDefinition[];

export type ProviderId = (typeof PROVIDER_REGISTRY)[number]["id"];
export type ProviderStorageKey = (typeof PROVIDER_REGISTRY)[number]["storageKey"];

export const PROVIDER_IDS = PROVIDER_REGISTRY.map((provider) => provider.id);

const providersById = new Map(PROVIDER_REGISTRY.map((provider) => [provider.id, provider]));
const providersByStorageKey = new Map(
  PROVIDER_REGISTRY.map((provider) => [provider.storageKey, provider]),
);

export function getProviderById(id: ProviderId): ProviderDefinition {
  const provider = providersById.get(id);
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }

  return provider;
}

export function getProviderByStorageKey(key: ProviderStorageKey): ProviderDefinition {
  const provider = providersByStorageKey.get(key);
  if (!provider) {
    throw new Error(`Unknown storage key: ${key}`);
  }

  return provider;
}

export function getEnvApiKey(providerId: ProviderId): string | undefined {
  return import.meta.env[getProviderById(providerId).envKey] as string | undefined;
}

export function getEffectiveApiKey(providerId: ProviderId, storedKey: string): string {
  return storedKey || getEnvApiKey(providerId) || "";
}

export function hasApiKey(providerId: ProviderId, storedKey: string): boolean {
  return Boolean(storedKey || getEnvApiKey(providerId));
}

export function hasEnvKey(providerId: ProviderId): boolean {
  return Boolean(getEnvApiKey(providerId));
}
