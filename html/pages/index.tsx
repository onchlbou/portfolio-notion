import { useEffect, useState } from 'react';
import { NotionRenderer, BlockMapType } from 'react-notion';
import Head from 'next/head';
import fetch from 'node-fetch';
import Button from '../components/Button';


const prod = true;
const proxy_domain = "nathanhue.com";
const proxy_port = "3001";
const menu_id = "34f3c0490b0d436a9b3821f8e6844b9c";


const Home = () => {
  const [blockMap, setBlockMap] = useState<BlockMapType | null>(null);
  const [menuData, setMenuData] = useState<any>({});
  const [selectedSection, setSelectedSection] = useState<string>('');

  const handlePageLinkClick = (event, blockValue) => {
    event.preventDefault();
    const cleanPageId = blockValue.id.replace(/-/g, '');
    const notionURL = `https://www.notion.so/${cleanPageId}`;
    window.open(notionURL, '_blank');
  };

  function fetchURL(prod, id) {
    if (prod) {
      return `https://${proxy_domain}:${proxy_port}/fetchNotionData/${id}`;
    } else {
      return `https://notion-api.splitbee.io/v1/page/${id}`;
    }
  }

  const fetchPageData = async (pageId: string) => {
    try {
      const url = fetchURL(prod, pageId);
      const response = await fetch(url);
      const data: BlockMapType = await response.json();
      setBlockMap(data);
    } catch (error) {
      console.error("An error occurred:", error);
      alert("Hello! Thanks for visiting my server. Please disable your browser blocker to load content from notion. If you dare... :)")
    }
  };

  const fetchMenuTableData = async () => {
    const results: { [key: string]: { button: string; url: string; id: string } } = {};
    try {
      const url = fetchURL(prod, menu_id);
      const response = await fetch(url);
      const data: BlockMapType = await response.json();
      const blockIds = Object.keys(data);
      const propertyKeys = ["N<XM", "QOJ>"];
      blockIds.slice(1).forEach(blockId => {
          if (data[blockId] && data[blockId].value && data[blockId].value.properties) {
              const buttonValue = data[blockId].value.properties["QOJ>"]?.[0]?.[0];
              const urlValue = data[blockId].value.properties["N<XM"]?.[0]?.[0];
              const regex = /([a-f0-9]{32})/i;
              const matches = urlValue.match(regex);
              const id = matches ? matches[0] : "";

              if (buttonValue && urlValue && id) {
                  results[blockId] = {
                      button: buttonValue,
                      url: urlValue,
                      id: id
                  };
              }
          }
      });
      console.log(results)
    } catch (error) {
      console.error("Error fetching menu table data:", error);
    }
    setMenuData(results);
  };

  useEffect(() => {
    if (selectedSection) {
      fetchPageData(selectedSection);
    }
  }, [selectedSection]);

  useEffect(() => {
    fetchMenuTableData();
  }, []); 

  const banner = `
   _   _       _    _       
  | \\ | |     | |  | |      
  |  \\| | __ _| |__| |_   _ 
  | . \` |/ _\` |  __  | | | |
  | |\\  | (_| | |  | | |_| |
  |_| \\_|\\__,_|_|  |_|\\__,_| v1.0
  `;

  return (
    <div>
      <Head>
        <style>{`body { margin: 10;}`}</style>
        <title>portfolio</title>
      </Head>
      <div className="App">
        <pre className="banner">{banner}</pre>
        <div className="button-container">
          {Object.values(menuData).map((item: any) => (
            <Button
              key={item.id}
              label={item.button}
              onClick={() => setSelectedSection(item.id)}
            />
          ))}
        </div>
      </div>
      <br />
      {blockMap && (
        <NotionRenderer
          blockMap={blockMap}
          fullPage
          hideHeader
          customBlockComponents={{
            page: ({ blockValue, renderComponent }) => (
              <div onClick={() => handlePageLinkClick(event, blockValue)}>
                {renderComponent()}
              </div>
            ),
          }}
        />
      )}
    </div>
  );
};

export default Home;
