import {useState, useEffect, useContext, useDeferredValue} from "react"
import {
    DirectionsRenderer,
    DirectionsService,
    GoogleMap,
    MarkerF,
    Polyline,
    TrafficLayer,
    useLoadScript
} from "@react-google-maps/api"
import "./SendLocation.css"
import { SocketContext } from "../../Context/SocketContext"
import { useParams } from "react-router-dom"
import {MAPS_KEY} from "../../Constants/keys.js";
import axios from "axios";
import {axiosConfig, SERVER_URL} from "../../Constants/config.js";



function Map()
{
    const {socket} =useContext(SocketContext)

    const [latitude,setLatitude]=useState(0);
    const [longitude,setLongitude]=useState(0);

    //To prevent react batch rendering problems
    const differedLatitude = useDeferredValue(latitude);
    const differedLongitude = useDeferredValue(longitude);

    const [directionsResponse, setDirectionsResponse] = useState(null);
    const directionsService = new google.maps.DirectionsService();


    const {id}=useParams()

    useEffect(()=>{

        const options = {
            enableHighAccuracy: true,
            maximumAge: 0,
        };

        const error = (err) => {
            console.error(`ERROR(${err.code}): ${err.message}`);
        }

        navigator.geolocation.watchPosition((position)=>{
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
        }, error, options);


    },[latitude,longitude])

    useEffect(() => {
        (async () => {
            const route = await axios.get(`${SERVER_URL}/api/v1/activeBus/${id}`, axiosConfig);
            const waypoints = [];
            route.data.bus.route.stations.map((station) => {
              waypoints.push({"location": `${station.position[0]} ${station.position[1]}`, "stopover": true});
            });

            console.log(waypoints);

            const directionsOptions = {
                destination: waypoints[waypoints.length-1].location ,
                origin: waypoints[0].location,
                waypoints: waypoints,
                travelMode: 'DRIVING',
            };

            directionsService.route(directionsOptions, (response, status) => {
                if (status === 'OK') {
                    setDirectionsResponse(response);
                } else {
                    console.log('Directions request failed: ', status);
                }
            });
        })();
    }, [])

    useEffect(() => {
        //Only emitting when there is a change in position
        socket.emit(`busId`,{latitude: differedLatitude, longitude: differedLongitude,id})
        console.log(differedLatitude, differedLongitude);
    }, [differedLatitude, differedLongitude])



    return (
        <>
        <div><h1 className="text-white">latitude :{differedLatitude}  longitude : {differedLongitude} </h1></div>
            <GoogleMap zoom={10} center={{lat:differedLatitude,lng:differedLongitude}} mapContainerClassName="map-container">
                {directionsResponse && <>
                    <TrafficLayer/>
                    <DirectionsRenderer options={{ directions: directionsResponse }}/>
                </>}
                <MarkerF position={{lat:differedLatitude,lng:differedLongitude}} />
            </GoogleMap>
        </>
    )
}


function SendLocation()
{
    const {isLoaded}=useLoadScript({
        googleMapsApiKey: MAPS_KEY
    })

    if(!isLoaded) return <h1 className="text-white">wait plz</h1>
    else
    return (
    <>
        <div>
            {/* <TrackVechicle/> */}
        </div>
        <Map className="mt-10"/>
    </>
    )
}

export default SendLocation




