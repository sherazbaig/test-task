import { useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  VerticalStack,
  Card,
  Button,
  Box,
  LegacyCard,
  Tabs,
  Divider
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session  } = await authenticate.admin(request);

  const shop = session.shop
  const apiAccessToken = session.accessToken;
  // TODO: Complete this function to fetch the assets from the Shopify API
  // and return the home, product, and collection templates.

  const assets = await admin.rest.resources.Asset.all({
    session,
    theme_id: 159186780458,
  });

  const homePages = assets.data.filter(
    (asset) =>
      asset.key?.includes('templates/index') &&
      Object.keys(asset).includes('key')
  );

  const collectionPages = assets.data.filter(
    (asset) =>
      asset.key?.includes('templates/collection') &&
      Object.keys(asset).includes('key')
  );

  const productPages = assets.data.filter(
    (asset) =>
      asset.key?.includes('templates/product') &&
      Object.keys(asset).includes('key')
  );

  return json({ data: {
    index: homePages,
    collection: collectionPages,
    product: productPages,
  } });
};

export const action = async ({request}) => {
  const formData = await request.formData();
  const selectedAssetKey = formData.get("selectedAssetKey");

  const { session, admin } = await authenticate.admin(request);

  const shop = session.shop
  const apiAccessToken = session.accessToken;
  // TODO: Complete this function to duplicate the selected asset
  // by creating a new asset with a random key and the same content.
  // format should be if homepage then index.{random10-characters-key}.liquid, collection then collection.{random10-characters-key}.liquid, product then product.{random10-characters-key}.liquid

  const asset = await admin.rest.resources.Asset.all({
    session: session,
    theme_id: 159186780458,
    asset: {"key": selectedAssetKey},
  });

  const newAsset = new admin.rest.resources.Asset({session: session});
  newAsset.theme_id = 159186780458;
  newAsset.key =  selectedAssetKey.split('.')[0] + "." + Math.random().toString(36).substring(2,12) + "." + selectedAssetKey.split('.')[1];
  newAsset.value = asset.data['0'].value;
  await newAsset.save;

  return json({status: 'success'});
};

export default function Index() {
  const { data } = useLoaderData();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const submit = useSubmit();

  const renderTemplates = (templates) => {
    return (
      <>
        {templates.map((template) => (
          <Layout.Section>
            <div onClick={()=>handleSelect(template)} style={ template === selectedAsset ? {border: "1px solid #008000"} : {}}>
              <Card key={template.key}>
                  <p>Asset Key: {template.key}</p>
                  <p>Theme ID: {template.theme_id}</p>
                  <p>Updated At: {template.updated_at}</p>
              </Card>
            </div>
          </Layout.Section>
        ))}
      </>
    );
  }
  
  const tabs = [
    {
      id: 'home-pages',
      content: "Home Pages",
      panelContent: renderTemplates(data.index),
      panelID: 'home-pages',
    },
    {
      id: 'collection-pages',
      content: "Collection Pages",
      panelContent: renderTemplates(data.collection),
      panelID: 'collection-pages',
    },
    {
      id: 'product-pages',
      content: "Product Pages",
      panelContent: renderTemplates(data.product),
      panelID: 'product-pages',
    }
  ];

  const handleSelect = (asset) => {
    setSelectedAsset(asset);
  };

  const handleDuplicate = () => {
    // TODO: Complete this function to submit the form with the selected asset key and theme ID.
    submit(document.getElementById("duplicate-form"), { replace: true });
  };

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTabIndex(selectedTabIndex)
  }, [selectedTabIndex]);

  const renderCard = () => {
    // TODO: Complete this function to render a card for each asset with its key, theme ID, and updated at time.
    return (
      <div>
        <div>
          {tabs[selectedTabIndex].panelContent}
        </div>
      </div>
    )
  };

  // TODO: Create the Tabs and Panels components and render the assets inside the Panels.
  const renderTabs = () => {
    return (
      <Tabs tabs={tabs} selected={selectedTabIndex} onSelect={handleTabChange}>
        <Divider />
        <Layout.Section>
          {renderCard()}
        </Layout.Section>
      </Tabs>
    )
  }

  return (
    <Page>
      <ui-title-bar title="Remix app template"></ui-title-bar>
      <VerticalStack gap="5">
        <Layout>
          <Layout.Section>
            <Card>
              {renderTabs()}
            </Card>
          </Layout.Section>
        </Layout>
        <form method="post" id="duplicate-form">
          <input type="hidden" name="selectedAssetKey" value={selectedAsset ? selectedAsset.key : ''} />
          <input type="hidden" name="selectedAssetThemeId" value={selectedAsset ? selectedAsset.theme_id : ''} />
          <Button
            primary
            disabled={!selectedAsset}
            onClick={handleDuplicate}
          >
            Duplicate Template
          </Button>
        </form>
      </VerticalStack>
    </Page>
  );
  
}
