import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Helper function to get DAO by address
async function getDAOByAddress(prisma: Context["prisma"], address: string) {
  return prisma.dao.findUnique({
    where: { address },
    select: { id: true, address: true },
  });
}

export const appRouter = router({
  // DAO queries
  dao: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().default(0),
          limit: z.number().default(10),
        })
      )
      .query(async ({ ctx, input }) => {
        const [daos, total] = await Promise.all([
          ctx.prisma.dao.findMany({
            skip: input.page * input.limit,
            take: input.limit,
            orderBy: { createdAt: "desc" },
            include: {
              _count: {
                select: { members: true, proposals: true },
              },
            },
          }),
          ctx.prisma.dao.count(),
        ]);

        return {
          daos,
          total,
          page: input.page,
          limit: input.limit,
        };
      }),

    getByAddress: publicProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        return ctx.prisma.dao.findUnique({
          where: { address: input },
          include: {
            members: true,
            proposals: {
              orderBy: { createdAt: "desc" },
            },
            activity: {
              orderBy: { timestamp: "desc" },
              take: 20,
            },
            _count: {
              select: { members: true, proposals: true },
            },
          },
        });
      }),

    getByCreator: publicProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        return ctx.prisma.dao.findMany({
          where: { creator: input },
          orderBy: { createdAt: "desc" },
        });
      }),
  }),

  // Proposal queries
  proposal: router({
    list: publicProcedure
      .input(
        z.object({
          daoAddress: z.string(),
          page: z.number().default(0),
          limit: z.number().default(10),
        })
      )
      .query(async ({ ctx, input }) => {
        const dao = await getDAOByAddress(ctx.prisma, input.daoAddress);

        if (!dao) return { proposals: [], total: 0 };

        const [proposals, total] = await Promise.all([
          ctx.prisma.proposal.findMany({
            where: { daoId: dao.id },
            skip: input.page * input.limit,
            take: input.limit,
            orderBy: { createdAt: "desc" },
            include: {
              _count: { select: { votes: true } },
            },
          }),
          ctx.prisma.proposal.count({ where: { daoId: dao.id } }),
        ]);

        return { proposals, total };
      }),

    getById: publicProcedure
      .input(z.object({ proposalId: z.string() }))
      .query(async ({ ctx, input }) => {
        return ctx.prisma.proposal.findUnique({
          where: { proposalId: BigInt(input.proposalId) },
          include: {
            votes: {
              include: { member: true },
            },
            dao: true,
          },
        });
      }),
  }),

  // Member queries
  member: router({
    list: publicProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        const dao = await getDAOByAddress(ctx.prisma, input);

        if (!dao) return [];

        return ctx.prisma.member.findMany({
          where: { daoId: dao.id },
          orderBy: { votingPower: "desc" },
          select: {
            id: true,
            address: true,
            votingPower: true,
            sharePercentage: true,
            joinedAt: true,
          },
        });
      }),

    getByAddress: publicProcedure
      .input(z.object({ daoAddress: z.string(), memberAddress: z.string() }))
      .query(async ({ ctx, input }) => {
        const dao = await getDAOByAddress(ctx.prisma, input.daoAddress);

        if (!dao) return null;

        return ctx.prisma.member.findUnique({
          where: {
            daoId_address: {
              daoId: dao.id,
              address: input.memberAddress,
            },
          },
          include: {
            votes: {
              include: {
                proposal: {
                  select: {
                    id: true,
                    proposalId: true,
                    title: true,
                    state: true,
                    createdAt: true,
                  },
                },
              },
              orderBy: { timestamp: "desc" },
              take: 50, // Limit votes returned
            },
          },
        });
      }),
  }),

  // Activity feed
  activity: router({
    list: publicProcedure
      .input(
        z.object({
          daoAddress: z.string().optional(),
          actor: z.string().optional(),
          type: z.string().optional(),
          limit: z.number().default(20).max(100),
        })
      )
      .query(async ({ ctx, input }) => {
        const where: any = {};

        if (input.daoAddress) {
          const dao = await getDAOByAddress(ctx.prisma, input.daoAddress);
          if (dao) where.daoId = dao.id;
          else return []; // Early return if DAO not found
        }

        if (input.actor) {
          where.actor = input.actor;
        }

        if (input.type) {
          where.type = input.type;
        }

        return ctx.prisma.activity.findMany({
          where,
          take: input.limit,
          orderBy: { timestamp: "desc" },
          select: {
            id: true,
            type: true,
            actor: true,
            metadata: true,
            timestamp: true,
            dao: {
              select: {
                id: true,
                address: true,
                name: true,
              },
            },
          },
        });
      }),
  }),

  // Stats
  stats: router({
    global: publicProcedure.query(async ({ ctx }) => {
      const [daoCount, totalMembers, totalProposals, totalVotes] = await Promise.all([
        ctx.prisma.dao.count(),
        ctx.prisma.member.count(),
        ctx.prisma.proposal.count(),
        ctx.prisma.vote.count(),
      ]);

      return {
        daoCount,
        totalMembers,
        totalProposals,
        totalVotes,
      };
    }),

    dao: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
      const dao = await getDAOByAddress(ctx.prisma, input);

      if (!dao) return null;

      const [counts, activeProposals] = await Promise.all([
        ctx.prisma.dao.findUnique({
          where: { id: dao.id },
          select: {
            _count: {
              select: {
                members: true,
                proposals: true,
                activity: true,
              },
            },
          },
        }),
        ctx.prisma.proposal.count({
          where: {
            daoId: dao.id,
            state: "Active",
          },
        }),
      ]);

      return {
        ...counts?._count,
        activeProposals,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
