#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class MCPClientManager {
  #config = null;
  #clients = new Map();
  #transports = new Map();

  async loadConfig(configPath) {
    const fullPath = resolve(process.cwd(), configPath);
    const content = await readFile(fullPath, "utf8");
    this.#config = JSON.parse(content);
    return this.#config;
  }

  async connectToServer(serverName) {
    const serverConfig = this.#config?.mcpServers?.[serverName];
    if (!serverConfig) {
      throw new Error(`Server ${serverName} not found in MCP config`);
    }
    if (serverConfig.disabled === true) {
      return null;
    }

    const transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args,
      env: serverConfig.env,
      // Prevent leaking headers/tokens printed by remote process.
      stderr: "ignore",
    });
    const client = new Client(
      {
        name: `grapuco-mcp-client-${serverName}`,
        version: "1.0.0",
      },
      { capabilities: {} },
    );

    await client.connect(transport);
    this.#clients.set(serverName, client);
    this.#transports.set(serverName, transport);
    return client;
  }

  async connectAll() {
    if (!this.#config) {
      throw new Error("MCP config not loaded. Call loadConfig first.");
    }

    const serverNames = Object.keys(this.#config.mcpServers ?? {});
    for (const serverName of serverNames) {
      await this.connectToServer(serverName);
    }
  }

  async callTool(serverName, toolName, args) {
    const client = this.#clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }
    return client.callTool({ name: toolName, arguments: args }, undefined, { timeout: 300000 });
  }

  async cleanup() {
    for (const client of this.#clients.values()) {
      try {
        await client.close();
      } catch {
        // best-effort cleanup
      }
    }
    for (const transport of this.#transports.values()) {
      try {
        await transport.close();
      } catch {
        // best-effort cleanup
      }
    }
    this.#clients.clear();
    this.#transports.clear();
  }
}
