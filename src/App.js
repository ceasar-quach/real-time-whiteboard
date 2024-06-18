import './App.css';
import LC, {LiterallyCanvasReactComponent} from "literallycanvas";

function App() {
  const socket = new WebSocket("wss://free.blr2.piesocket.com/v3/1?api_key=6Y8zCW9ugCr0KaAxxVELRkXL1ntUGNkWp1ql7kxN&notify_self=0")
  const LcContainer = () => {
    //Overrriding default LC tools graphics with fontAwesome icons
    var tools = document.getElementsByClassName("toolbar-button thin-button")
    for ( var i=0; i<tools.length; i++) {
        var faIconChild = document.createElement('i')
        if([...tools][i].title==="Text"){
            faIconChild.className = "fa-solid fa-keyboard"
        }else if ([...tools][i].title==="Pan") {
            faIconChild.className = "fa-solid fa-up-down-left-right"
        }else if ([...tools][i].title==="Zoom out") {
            faIconChild.className = "fa-solid fa-magnifying-glass-minus"
        }else if ([...tools][i].title==="Zoom in") {
            faIconChild.className = "fa-solid fa-magnifying-glass-plus"
        }else{
            faIconChild.className = "fa-solid fa-"+ [...tools][i].title.toLowerCase()
        }
        tools[i].style.backgroundImage = null
        tools[i].appendChild(faIconChild)
    }
    return(
        <LiterallyCanvasReactComponent
            onInit={canvasInit}
            imageURLPrefix="/assets"
            defaultStrokeWidth='2'
            primaryColor={"#c22929"}
            tools={[
                LC.tools.Pencil,
                LC.tools.Eraser,
                LC.tools.Text,
                LC.tools.Pan,
            ]}
        />
    )}

  const canvasInit = async lc => {
        const sendDrawingtoWebsocket = async (data) => {
            data&&socket.send(JSON.stringify(data))
        }
        lc.on('drawStart', ()=>{
            // listening to drawing change event
            var unsubscribe = lc.on('drawingChange', ()=>{
                sendDrawingtoWebsocket({
                    className:LC.util.last(lc.getSnapshot(['shapes']).shapes).className,
                    color: "#c22929",
                    points:LC.util.last(lc.getSnapshot(['shapes']).shapes).data.pointCoordinatePairs, 
                })
            })
            lc.on('drawEnd', ()=>unsubscribe())
        })
        lc.on('toolChange', ()=>{
          Object.getPrototypeOf(lc.tool).name === "Eraser"?
              lc.tool.strokeWidth = 25
              :
              lc.tool.strokeWidth = 2
        })
        //handle undo and redo temporarily, this need custom tool later
        lc.on('undo', ()=>{
            sendDrawingtoWebsocket({
                className:'undo',
            })
        })
        lc.on('redo', ()=>{
            sendDrawingtoWebsocket({
                className:LC.util.last(lc.getSnapshot(['shapes']).shapes).className,
                color: LC.util.last(lc.getSnapshot(['shapes']).shapes).data.pointColor,
                points:LC.util.last(lc.getSnapshot(['shapes']).shapes).data.pointCoordinatePairs, 
            })
        })
        
        socket.onmessage = async (e) => {
          let data = JSON.parse(e.data)
          // recieved broadcast data
          lc.saveShape(LC.createShape(data.className, {
              points: data.points.map(
                  points=>LC.createShape('Point', {x:points[0], y:points[1], size:data.className==='LinePath'?2:25, color:data.color})
              )
          }))
        }
  }
  return (
    <LcContainer/>
  );
}

export default App;
