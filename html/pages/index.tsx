import { useEffect, useState } from 'react';
import { NotionRenderer, BlockMapType } from 'react-notion';
import Head from 'next/head';
import fetch from 'node-fetch';
import Button from '../components/Button';
import Favicon from '../components/Favicon';


const prod = true;
//const proxy_domain = "localhost";
const proxy_domain = "nathanhue.com";
const proxy_port = "3001";
const menu_id = "34f3c0490b0d436a9b3821f8e6844b9c";


const Home = () => {
  const [blockMap, setBlockMap] = useState<BlockMapType | null>(null);
  const [menuData, setMenuData] = useState<any>({});
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [pageIds, _setPageIds] = useState<string[]>([]); 

  const setPageIds = (newPageIds: string[]) => {
    if (!newPageIds.includes(menu_id)) {
      _setPageIds([menu_id, ...newPageIds]);
    } else {
      _setPageIds(newPageIds);
    }
  }

  const handlePageLinkClick = (event, blockValue) => {
    event.preventDefault();
    const cleanPageId = blockValue.id.replace(/-/g, '');
    const notionURL = `https://www.notion.so/${cleanPageId}`;
    window.open(notionURL, '_blank');
  };

  function fetchURL(prod, id) {
    const protocol = prod ? 'https' : 'http';
    const query = `${protocol}://${proxy_domain}:${proxy_port}/fetchNotionData/${id}`;
    console.log("fetchUrl:", query)
    return query;
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
    const fetchedPageIds: string[] = []; 


    try {
      const url = fetchURL(prod, menu_id);
      //console.log('Fetching data from:', url);
      const response = await fetch(url);
      //console.log('Server Response:', response);
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
                  fetchedPageIds.push(id); 
              }
          }
      });
      console.log(results)
      setPageIds(fetchedPageIds);
    } catch (error) {
      console.error("Error fetching menu table data:", error);
    }
    setMenuData(results);
  };

  const refreshAllCaches = async () => {
    try {
        const url = prod ? `https://${proxy_domain}:${proxy_port}/refreshCache` : `http://localhost:${proxy_port}/refreshCache`;
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageIds: pageIds }) 
        };
        
        const response = await fetch(url, requestOptions);
        if (response.status === 200) {
            console.log("Cache refreshed successfully.");
        } else {
            console.error("Failed to refresh cache.");
        }
    } catch (error) {
        console.error("An error occurred while refreshing the cache:", error);
    }
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
          <Favicon/>
          <title>Nathan Hue | Portfolio</title>
          <meta name="description" content="Portfolio made with typescript and notion.so as a cms." />
          <meta name="keywords" content="Cyber Programming Security Typescript Engineer React Python Exploit Network Concept" />
      </Head>
      <div className="App">
        <pre className="banner">{banner}</pre>
        <button className="refresh-button" onClick={refreshAllCaches} style={{ position: 'absolute', top: '10px', right: '10px' }}>
            ⟳
        </button>
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
