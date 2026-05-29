type ResolverFn = (
  parent: unknown,
  args: Record<string, unknown>,
  context: Record<string, unknown>,
  info: unknown,
) => unknown;

// Decorator-style wrapper to inject authenticated user id into resolver args.
export function currentUser(argName: string, resolver: ResolverFn): ResolverFn {
  return async (parent, args, context, info) => {
    const contextUserId = context.userId;
    if (!contextUserId) {
      throw new Error('Unauthorized alert!!!!!!!!!!');
    }

    const nextArgs = {
      ...args,
      [argName]: args[argName] ?? String(contextUserId),
    };

    return resolver(parent, nextArgs, context, info);
  };
}
