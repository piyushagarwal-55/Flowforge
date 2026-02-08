"use client";

import { useNodeConfigs } from "@/components/workflow/build/nodeConfigs";
import { BaseNodeEditor } from "../Ui/BaseNodeEditor";

export default function InputValidationNodeEditor(props: any) {
  const NODE_CONFIGS = useNodeConfigs();
  return <BaseNodeEditor {...props} config={NODE_CONFIGS.inputValidation} />;
}
