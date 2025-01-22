// Map Initialization
var map = L.map('map').setView([16.265, -61.550], 12.4);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let markers = [];


let parameters = {
    "voie_generale": "0",
    "voie_technologique": "0",
    "voie_professionnelle": "0",
    "restauration": "0",
    "hebergement": "0",
    "ulis": "0",
    "apprentissage": "0",
    "segpa": "0",
    "section_arts": "0",
    "section_cinema": "0",
    "section_theatre": "0",
    "section_sport": "0",
    "section_internationale": "0",
    "section_europeenne": "0",
    "lycee_agricole": "0",
    "lycee_militaire": "0",
    "lycee_des_metiers": "0",
    "ecole_elementaire": "0",
    "ecole_maternelle": "0",

};

const baseUrl = 'https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-annuaire-education/records?where=code_departement%3D%27971%27&limit=100';

function generateUrlFromParameters() {
    let url = baseUrl;
    Object.keys(parameters).forEach(key => {
        if (parameters[key] != "0") {
            url += `&where=${key}%3D1`;
        }
    });
    return url;
}

function generateUrlFromSearch(search) {
    search = encodeURIComponent(search);
    let url = baseUrl;
    url += `&where=nom_etablissement%20LIKE%20%27${search}%27`;
    return url;
}

// Ajouter MarkerClusterGroup
let markerClusterGroup = L.markerClusterGroup();
map.addLayer(markerClusterGroup);

function fetchAndAddMarkers(url, offset = 0, first = true) {
    if (first) {
        showLoader();
    }
    fetch(`${url}&offset=${offset}`)
        .then(response => response.json())
        .then(data => {

            if (first) {
                //Nombre de resultats
                document.getElementById('resultsCount').textContent = data.total_count;
                // Supprimer les anciens marqueurs du cluster
                markerClusterGroup.clearLayers();
                const lyceesList = document.getElementById('lyceesList');
                //Empty Liste
                lyceesList.innerHTML = '';
            }

            data.records.forEach(record => {

                const lycee = record.record.fields;

                if (lycee.latitude && lycee.longitude) {
                    const lycee = record.record.fields;

                    const modalContent = `
                               <div class="modal fade" id="infoModal" tabindex="-1" aria-labelledby="infoModalLabel" aria-hidden="true">
                                   <div class="modal-dialog">
                                       <div class="modal-content">
                                           <div class="modal-header">
                                               <h5 class="modal-title" id="infoModalLabel">${lycee.nom_etablissement}</h5>
                                               <span class="badge text-bg-${lycee.etat == "OUVERT" ? `success` : `danger`} ms-5">${lycee.etat}</span>
                                               <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                           </div>
                                           <div class="modal-body">
                                               ${lycee.etat != 'OUVERT' ? `<div class="alert alert-danger" role="alert">
                                               Cette établissement est fermé !
                                               </div>` : ''}
                                               <div class="border-3 ps-2 border-primary border-start">
                                                   <h4>Informations</h4>
                                                   <label><i class="pe-2 bi bi-mortarboard-fill"></i>${lycee.type_etablissement}</label> <br>
                                                   <a href="mailto:${lycee.mail}" class="text-decoration-none"><i class=" pe-2 bi bi-envelope-fill"></i>${lycee.mail}</a> <br>
                                                   <label class=""><i class="pe-2 bi bi-telephone-fill"></i>${lycee.telephone}</label> <br>
                                                   ${lycee.web ? `<label class=""><i class="pe-2 bi bi-globe2"></i>${lycee.web}</label>` : ''}
                                               </div>
                                               <div class="border-3 ps-2 border-primary border-start">
                                                   <h4 class="mt-3">Adresse</h4>
                                                   ${lycee.adresse_1 ? `<label >${lycee.adresse_1}</label> <br>` : ''}
                                                   ${lycee.adresse_2 ? `<label >${lycee.adresse_2}</label> <br>` : ''}
                                                   ${lycee.adresse_3 ? `<label >${lycee.adresse_3}</label>` : ''}
                                                   <p><strong>Code Postal:</strong> ${lycee.code_postal}</p>
                                               </div>
                                           </div>
                                           <div class="modal-footer">
                                               ${lycee.fiche_onisep ? `<a href="${lycee.fiche_onisep}" type="button" class="btn btn-info">Fiche ONISEP</a>` : ''}
                                               <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           `;


                    const listItem = document.createElement('a');
                    listItem.className = 'list-group-item list-group-item-action';
                    listItem.href = '#';
                    listItem.textContent = lycee.nom_etablissement;
                    listItem.addEventListener('click', () => {
                        map.setView([lycee.latitude, lycee.longitude], 15);
                        document.body.insertAdjacentHTML('beforeend', modalContent);
                        const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
                        infoModal.show();
                        infoModal._element.addEventListener('hidden.bs.modal', () => {
                            document.getElementById('infoModal').remove();
                        });
                    });
                    lyceesList.appendChild(listItem);

                    let marker = L.marker([lycee.latitude, lycee.longitude]);

                    // Créer le contenu du popup
                    const popupContent = `<b>${lycee.nom_etablissement}</b><br><b class="border-2 text-muted ps-1 border-primary border-start" >${lycee.type_etablissement}</b>`;

                    // Ajouter des événements de survol
                    marker.on('mouseover', () => {
                        marker.bindPopup(popupContent).openPopup();
                    });

                    marker.on('mouseout', () => {
                        marker.closePopup();
                    });
                    marker.on('click', () => {

                        document.body.insertAdjacentHTML('beforeend', modalContent);
                        const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
                        infoModal.show();
                        infoModal._element.addEventListener('hidden.bs.modal', () => {
                            document.getElementById('infoModal').remove();
                        });
                    });

                    // Ajouter le marqueur au cluster
                    markerClusterGroup.addLayer(marker);
                }
            });

            if (data.total_count > offset + data.records.length) {
                fetchAndAddMarkers(url, offset + data.records.length, false);
            } else {
                hideLoader();
            }
        })
        .catch(error => {
            console.error('Error fetching lycees:', error);
            hideLoader();
        });
}

function showLoader() {
    Array.from(document.getElementsByClassName('loader')).forEach(loader => loader.style.display = 'flex');

}
function hideLoader() {
    Array.from(document.getElementsByClassName('loader')).forEach(loader => loader.style.display = 'none');
}

//Generate Liste



// Generate Form Inputs
const filterForm = document.getElementById('filterForm');


Object.keys(parameters).forEach(key => {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-check form-switch mb-3';

    const input = document.createElement('input');
    input.className = 'form-check-input';
    input.type = 'checkbox';
    input.id = key;
    input.checked = parameters[key] === "1";

    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.setAttribute('for', key);
    label.textContent = key.replace(/_/g, ' ').toUpperCase();

    formGroup.appendChild(input);
    formGroup.appendChild(label);
    filterForm.appendChild(formGroup);
    const hr = document.createElement('hr');
    filterForm.appendChild(hr);

});



searchForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const search = document.getElementById('searchForm').querySelector('input').value;
    search == '' ? fetchAndAddMarkers(generateUrlFromParameters()) : fetchAndAddMarkers(generateUrlFromSearch(search)); // Call original function




});

filterForm.addEventListener('submit', (e) => {
    e.preventDefault();

    document.getElementById('searchForm').querySelector('input').value = '';


    Object.keys(parameters).forEach(key => {
        const input = document.getElementById(key);
        parameters[key] = input.checked ? "1" : "0";
    });

    const newUrl = generateUrlFromParameters();
    fetchAndAddMarkers(newUrl); // Call original function
});

// Sidebar Toggle Functionality
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');

toggleSidebar.addEventListener('click', () => {
    sidebar.style.right = sidebar.style.right === '0px' ? '-300px' : '0px';
});

// Initial Fetch
fetchAndAddMarkers(generateUrlFromParameters());
