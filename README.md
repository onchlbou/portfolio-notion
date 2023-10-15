## Info

Edit and start the proxy server file:  

	node express_server/index.js  

In the file  
 
	html/pages/index.tsx  

Set variables:  
 - prod  
 - proxy_domain  
 - proxy_port  
 - menu_id  

Then run:
    
	npm run build      
	npm start    

## Example  

https://nathanhue.com


## Run in the background

	pm2 start ./start_back.sh --name "nathanhue-portfolio-back"  
	pm2 start ./start_front.sh --name "nathanhue-portfolio-front"  
	pm2 save
