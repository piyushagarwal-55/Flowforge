"use client";

import { BaseNode } from "./BaseNode";
import { Zap } from "lucide-react";

export function MCPToolNode(props: any) {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: <Zap size={16} />,
      }}
    />
  );
}
