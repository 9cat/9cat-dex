import { actionTree, getterTree } from 'typed-vuex'
import { FundingPayment, TradingReward } from '@injectivelabs/sdk-ts'
import { BankBalanceWithTokenAndBalance } from '@injectivelabs/sdk-ui-ts'
import { indexerAccountApi, indexerDerivativesApi } from '~/app/Services'
import { ActivityFetchOptions } from '~/types'

const initialStateFactory = () => ({
  subaccountFundingPayments: [] as Array<FundingPayment>,
  tradingRewardsHistory: [] as Array<TradingReward>,
  subaccountFundingPaymentsPagination: {
    endTime: 0 as number,
    total: 0 as number
  },
  supportedTokens: [] as Array<BankBalanceWithTokenAndBalance>
})

const initialState = initialStateFactory()

export const state = () => ({
  subaccountFundingPayments:
    initialState.subaccountFundingPayments as Array<FundingPayment>,
  tradingRewardsHistory:
    initialState.tradingRewardsHistory as Array<TradingReward>,
  subaccountFundingPaymentsPagination:
    initialState.subaccountFundingPaymentsPagination,
  supportedTokens:
    initialState.supportedTokens as Array<BankBalanceWithTokenAndBalance>
})

export type ActivityStoreState = ReturnType<typeof state>

export const getters = getterTree(state, {
  //
})

export const mutations = {
  setSubaccountFundingPayments(
    state: ActivityStoreState,
    subaccountFundingPayments: Array<FundingPayment>
  ) {
    state.subaccountFundingPayments = subaccountFundingPayments
  },

  setTradingRewardHistory(
    state: ActivityStoreState,
    tradingRewardsHistory: Array<TradingReward>
  ) {
    state.tradingRewardsHistory = tradingRewardsHistory
  },

  setSubaccountFundingPaymentsEndTime(
    state: ActivityStoreState,
    endTime: number
  ) {
    state.subaccountFundingPaymentsPagination.endTime = endTime
  },

  setSubaccountFundingPaymentsTotal(state: ActivityStoreState, total: number) {
    state.subaccountFundingPaymentsPagination.total = total
  },

  setSupportedTokens(
    state: ActivityStoreState,
    supportedTokens: Array<BankBalanceWithTokenAndBalance>
  ) {
    state.supportedTokens = supportedTokens
  },

  reset(state: ActivityStoreState) {
    const initialState = initialStateFactory()

    state.tradingRewardsHistory = initialState.tradingRewardsHistory
  }
}

export const actions = actionTree(
  { state, mutations },
  {
    async fetchTradingRewardsHistory({ commit }) {
      const { subaccount } = this.app.$accessor.account
      const { isUserWalletConnected, injectiveAddress } =
        this.app.$accessor.wallet

      if (!isUserWalletConnected || !subaccount || !injectiveAddress) {
        return
      }

      commit(
        'setTradingRewardHistory',
        await indexerAccountApi.fetchRewards({
          address: injectiveAddress,
          epoch: -1
        })
      )
    },

    async fetchSubaccountFundingPayments(
      { state, commit },
      activityFetchOptions: ActivityFetchOptions | undefined
    ) {
      const { subaccount } = this.app.$accessor.account
      const { isUserWalletConnected } = this.app.$accessor.wallet

      if (!isUserWalletConnected || !subaccount) {
        return
      }

      if (
        state.subaccountFundingPayments.length > 0 &&
        state.subaccountFundingPaymentsPagination.endTime === 0
      ) {
        commit(
          'setSubaccountFundingPaymentsEndTime',
          state.subaccountFundingPayments[0].timestamp
        )
      }

      const paginationOptions = activityFetchOptions?.pagination
      const filters = activityFetchOptions?.filters

      const { fundingPayments, pagination } =
        await indexerDerivativesApi.fetchFundingPayments({
          marketId: filters?.marketId,
          marketIds: filters?.marketIds,
          subaccountId: subaccount.subaccountId,
          pagination: {
            skip: paginationOptions ? paginationOptions.skip : 0,
            limit: paginationOptions ? paginationOptions.limit : 0,
            endTime: state.subaccountFundingPaymentsPagination.endTime
          }
        })

      commit('setSubaccountFundingPaymentsTotal', pagination.total)
      commit('setSubaccountFundingPayments', fundingPayments)
    }
  }
)
