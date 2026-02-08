import { EventConfig, StepHandler } from "motia";

export const config: EventConfig = {
  name: "delay",
  type: "event",
  subscribes: ["delay"],
  emits: ["workflow.run"],
};

export const handler: StepHandler<typeof config> = async (payload, ctx) => {
  const { step, steps, index, vars, executionId } = payload as any;
  const { logger, emit } = ctx;

  const delaySeconds = Number(step.seconds || 0);

  logger.info(
    `⏳ Delay step triggered — waiting ${delaySeconds}s before continuing`
  );

  // Simple in-memory delay (no Redis, no queues)
  await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

  logger.info(`✅ Delay complete — continuing workflow`);

  await emit({
    topic: "workflow.run",
    data: {
      steps,
      index: index + 1,
      vars,
      executionId,
    },
  });
};
