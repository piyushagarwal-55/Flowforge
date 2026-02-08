"use client";

import { useNodeConfigs } from "@/components/workflow/build/nodeConfigs";
import { BaseNodeEditor } from "./BaseNodeEditor";

export default function InputNodeEditor(props: any) {
  const NODE_CONFIGS = useNodeConfigs();
  return <BaseNodeEditor {...props} config={NODE_CONFIGS.input} />;
}
