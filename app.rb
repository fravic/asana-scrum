require 'sinatra'

helpers do
end

get '/' do
  File.read("index.html")
end
