require 'rubygems'
require 'sinatra/base'
require 'rack/reverse_proxy'

ASANA_API_URL = 'https://app.asana.com/api/1.0'
ASANA_API_KEY = "ggCfvgG.y18qBCLzfVSlfeHMyKgHLebl"

class Scrum < Sinatra::Base
  set :sessions, true

  use Rack::ReverseProxy do
    reverse_proxy_options :preserve_host => true
    reverse_proxy /^\/(?!css)(?!js)(?!auth)(.+)$/, ASANA_API_URL + '/$1', :username => ASANA_API_KEY, :password => ''
  end

  get '/' do
    File.read('public/index.html')
  end

  run! if app_file == $0
end
