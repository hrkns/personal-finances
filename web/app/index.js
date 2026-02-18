const appDom = createAppDom(document);
const appState = createAppState();
const apiRequest = createApiRequest(frontendUtils.parseApiResponse);

const appModules = createAppModules({
  dom: appDom,
  state: appState,
  apiRequest,
  frontendUtils,
});

const appRouting = createAppRouting({
  tabButtonElements: appDom.tabButtonElements,
  views: appDom.views,
  frontendRouter,
});

init();

async function init() {
  await appModules.banksModule.loadCountryOptions();

  const initialRoute = frontendRouter.ensureValidRoute();
  appRouting.applyRoute(initialRoute);

  frontendRouter.onRouteChange(appRouting.applyRoute);
  appRouting.bindTabNavigation();

  await Promise.all([
    appModules.transactionCategoriesModule.load(),
    appModules.peopleModule.load(),
    appModules.currenciesModule.load(),
    appModules.banksModule.load(),
    appModules.bankAccountsModule.load(),
  ]);

  appDom.transactionCategories.formElement.addEventListener("submit", appModules.transactionCategoriesModule.onSubmit);
  appDom.transactionCategories.cancelButtonElement.addEventListener(
    "click",
    appModules.transactionCategoriesModule.resetForm
  );

  appDom.people.formElement.addEventListener("submit", appModules.peopleModule.onSubmit);
  appDom.people.cancelButtonElement.addEventListener("click", appModules.peopleModule.resetForm);

  appDom.currency.formElement.addEventListener("submit", appModules.currenciesModule.onSubmit);
  appDom.currency.cancelButtonElement.addEventListener("click", appModules.currenciesModule.resetForm);

  appDom.bank.formElement.addEventListener("submit", appModules.banksModule.onSubmit);
  appDom.bank.cancelButtonElement.addEventListener("click", appModules.banksModule.resetForm);

  appDom.bankAccounts.formElement.addEventListener("submit", appModules.bankAccountsModule.onSubmit);
  appDom.bankAccounts.cancelButtonElement.addEventListener("click", appModules.bankAccountsModule.resetForm);
}
