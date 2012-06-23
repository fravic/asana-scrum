require 'rubygems'
require 'sinatra'
require 'rack/reverse_proxy'

ASANA_API_URL = 'https://app.asana.com/api/1.0'
API_KEY = 'ggCfvgG.y18qBCLzfVSlfeHMyKgHLebl'

use Rack::ReverseProxy do
  reverse_proxy_options :preserve_host => true
  reverse_proxy /^\/(?!css)(?!js)(.+)$/, ASANA_API_URL + '/$1', :username => API_KEY, :password => ''
end

get '/' do
  File.read('public/index.html')
end
