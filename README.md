# webgl-proyecto3

Buenos días.

No configuré que las texturas esperaran a que se cargaran para ponerse, entonces la primera vez va a aparecer una imagen en negro. Basta con reiniciar el Github Pages para que se vea correctamente.

<img width="462" alt="image" src="https://user-images.githubusercontent.com/26715082/200184043-d767115f-a833-4494-96eb-bfae46e4bcc0.png">

Features importantes de el proyecto es que por ejemplo todo tiene multitexturas. Si se mira el fragment shader se verá que se suman los valores de dos coordenadas distintas de texturas (si esto cuenta como prueba del trabajo que no entregué de multitexturas, lo agradecería x'd). 

<img width="607" alt="image" src="https://user-images.githubusercontent.com/26715082/200184226-49f5cbd6-8a5f-4404-86b2-37b304c27cbc.png">

Generalmente esto no significa nada porque se combina una textura blanca con cualquier otra textura, pero en la camiseta de la persona se ve claro porque se combina el patrón de Groove sobre una camiseta blanca.

<img width="132" alt="image" src="https://user-images.githubusercontent.com/26715082/200184965-9498db41-1105-4de8-b66f-7f27b8220a8c.png">

Lo anterior nos lleva a otro feature, y es que se hizo un mapa de texturas para simplificar el proceso de incluir distintas texturas y colores.

<img width="800" height="400" alt="texture" src="https://user-images.githubusercontent.com/26715082/200184590-a404d07b-8b08-48ff-813a-16a0389637dd.png">

También es importante que la parte de **interacción del usuario** se ve cuando uno presiona la tecla "Espacio". Lo anterior causa que el personaje y su taiyaki cuadrado se animen con una curva generada por Bezier.

<img width="452" alt="image" src="https://user-images.githubusercontent.com/26715082/200184336-d36cbe1f-afac-46ab-b494-45e2e0d973ec.png">

El código de la curva de Bezier que se generó es el siguiente, ese sí no está incluido en el Github. Se hizo uso de la librería Bezier.JS (https://pomax.github.io/bezierjs/). La curva generada se guardó en la variable "curva" del archivo librería.js.

<img width="412" alt="image" src="https://user-images.githubusercontent.com/26715082/200184403-7b348a58-892a-402e-a691-a9b1c05edf95.png">

En cuanto a las luces, hay una luna que ilumina una parte del escenario con la luz que refleja del sol, mientras que la parte contraria no lo hace. Para lograr que el cielo se iluminara de forma correcta, fue necesario implementar una corrección a las normales de los objetos, dependendo de si estos apuntaban inwards o outwards. 

<img width="455" alt="image" src="https://user-images.githubusercontent.com/26715082/200184693-050e7c65-4046-440f-b5cd-416b95d4538b.png">



