// 地図スタイル: 黒背景・塗りなし・オレンジ2px枠線
const O='#ff8a00';
const W=(a,b)=>['interpolate',['exponential',1.5],['zoom'],6,a,18,b];
const road=(id,cls,minz,w,col)=>({id,type:'line',source:'mb','source-layer':'road',minzoom:minz,
 filter:['all',['==',['geometry-type'],'LineString'],['in',['get','class'],['literal',cls]]],
 layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':col,'line-width':w}});
const MAJ=['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link'];
const MIN=['tertiary','tertiary_link','street','street_limited'];
const SML=['service','pedestrian','path','track'];
const TXT={'text-field':['coalesce',['get','name_ja'],['get','name']],'text-font':['DIN Pro Medium','Arial Unicode MS Regular'],visibility:'none'};
const HALO={'text-color':O,'text-halo-color':'#000000','text-halo-width':2};
const STYLE={version:8,glyphs:'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
 sources:{mb:{type:'vector',url:'mapbox://mapbox.mapbox-streets-v8'}},
 layers:[
  {id:'bg',type:'background',paint:{'background-color':'#000000'}},
  {id:'water',type:'line',source:'mb','source-layer':'water',paint:{'line-color':O,'line-width':2}},
  {id:'admin',type:'line',source:'mb','source-layer':'admin',filter:['all',['<=',['get','admin_level'],4],['==',['get','maritime'],'false']],paint:{'line-color':O,'line-width':2,'line-dasharray':[4,3]}},
  road('c-sml',SML,15,W(4.3,12),O),road('c-min',MIN,11,W(4.3,20),O),road('c-maj',MAJ,5,W(2.5,30),O),
  road('i-sml',SML,15,W(.3,8),'#000'),road('i-min',MIN,11,W(.3,16),'#000'),road('i-maj',MAJ,5,W(.5,26),'#000'),
  {id:'bld',type:'line',source:'mb','source-layer':'building',minzoom:14,paint:{'line-color':O,'line-width':2}},
  {id:'b3d',type:'fill-extrusion',source:'mb','source-layer':'building',minzoom:14,filter:['==',['get','extrude'],'true'],layout:{visibility:'none'},
   paint:{'fill-extrusion-color':'#000000','fill-extrusion-height':['get','height'],'fill-extrusion-base':['get','min_height'],'fill-extrusion-opacity':1,'fill-extrusion-vertical-gradient':false}},
  {id:'rlabel',type:'symbol',source:'mb','source-layer':'road',minzoom:13,filter:['has','name'],layout:{...TXT,'symbol-placement':'line','text-size':12},paint:HALO},
  {id:'place',type:'symbol',source:'mb','source-layer':'place_label',layout:{...TXT,'text-size':['interpolate',['linear'],['zoom'],4,11,16,17],'text-max-width':8},paint:HALO}
 ]};
