import configJson from "./config.json";

export function getConfig() {
  return {
    domain: configJson.domain,
  };
}
